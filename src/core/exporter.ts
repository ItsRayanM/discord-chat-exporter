import { mkdir, rm } from "node:fs/promises";
import type {
  AIProvider,
  AnalyticsReport,
  BatchExportRequest,
  BatchExportResult,
  DatabaseDeliveryAdapter,
  ExportRequest,
  ExportResult,
  ExportStats,
  ExporterConfig,
  LiveRecorderHandle,
  RecorderStartOptions,
  RenderArtifact,
  RendererPlugin,
  TranscriptDocument,
  TranscriptMessage,
} from "@/types.js";
import { collectMessages, DiscordApiClient } from "@/modules/discord/index.js";
import {
  processAttachments,
  buildTranscript,
  applyFilters,
  applyRedaction,
  applyDeltaFilter,
  loadDeltaCheckpoint,
  saveDeltaCheckpoint,
} from "@/modules/transcript/index.js";
import {
  RendererRegistry,
  renderAnalyticsJson,
  renderCsv,
  renderDocx,
  renderHtmlBundle,
  renderHtmlSingle,
  renderJsonClean,
  renderJsonFull,
  renderMarkdown,
  renderPdf,
  renderSqlite,
  renderText,
  renderXml,
  renderZip,
} from "@/modules/rendering/index.js";
import { ValidationError } from "@/shared/errors/index.js";
import { startLiveRecorder } from "@/modules/recorder/index.js";
import { generateAnalyticsReport } from "@/modules/analytics/index.js";
import {
  AnthropicClaudeProvider,
  GoogleGeminiProvider,
  HeuristicAIProvider,
  OpenAIProvider,
} from "@/modules/ai/index.js";
import { emitMonitoringEvent, createExportId } from "@/modules/export/monitoring.js";
import { generateComplianceArtifacts } from "@/modules/compliance/index.js";
import { exportBatchChannels } from "@/modules/export/batch-export.js";
import { compareSnowflakes, getMaxSnowflakeId } from "@/shared/utils/snowflake.js";
import {
  loadIncrementalState,
  saveIncrementalStateIfNeeded,
} from "@/modules/export/application/incremental-state.js";
import { mergeRecorderEvents } from "@/modules/export/application/recorder-merge.js";
import { validateBatchRequest, validateRequest } from "@/modules/export/application/validate-request.js";
import {
  buildBaseName,
  cloneTranscriptWithMessages,
  splitTranscriptByPolicy,
} from "@/modules/export/application/transcript-chunking.js";
import { maybeGenerateAISummary } from "@/modules/export/application/ai-summary.js";
import { deliverOutputTargets } from "@/modules/export/application/delivery-resolver.js";
import { resolveOutputPlan } from "@/modules/export/infrastructure/output-plan.js";
import { EXPORTER_VERSION } from "@/shared/constants.js";

/** Optional factory to supply a custom API client (e.g. for tests or doctor). */
export interface ExporterConfigWithFactory extends ExporterConfig {
  apiClientFactory?: (opts: { token: string; userAgent?: string }) => DiscordApiClient;
}

export class DiscordChatExporter {
  private readonly config: ExporterConfigWithFactory;
  private readonly registry = new RendererRegistry();
  private readonly aiProviders = new Map<string, AIProvider>();
  private readonly databaseAdapters = new Map<string, DatabaseDeliveryAdapter>();

  public constructor(config: ExporterConfigWithFactory = {}) {
    this.config = config;
    this.registerAIProvider(new HeuristicAIProvider());
  }

  public registerRenderer(plugin: RendererPlugin): void {
    this.registry.register(plugin);
  }

  public registerAIProvider(provider: AIProvider): void {
    this.aiProviders.set(provider.id, provider);
  }

  public registerDatabaseAdapter(adapter: DatabaseDeliveryAdapter): void {
    const id = adapter.id.trim().toLowerCase();
    if (!id) {
      throw new ValidationError("Database adapter id is required.");
    }
    this.databaseAdapters.set(id, adapter);
  }

  public async exportChannel(request: ExportRequest): Promise<ExportResult> {
    validateRequest(request);

    const startedAt = Date.now();
    const warnings: string[] = [];
    const limitations: string[] = [];
    let emittedWarningIndex = 0;
    const exportId = createExportId(request.channelId);

    const flushWarnings = async (activeRequest: ExportRequest): Promise<void> => {
      while (emittedWarningIndex < warnings.length) {
        const message = warnings[emittedWarningIndex];
        emittedWarningIndex += 1;
        if (!message) {
          continue;
        }
        await emitMonitoringEvent(activeRequest, {
          kind: "warning",
          message,
        });
      }
    };

    const outputPlan = await resolveOutputPlan(request);
    const resolvedRequest: ExportRequest = {
      ...request,
      output: {
        ...request.output,
        dir: outputPlan.outputDir,
        target: outputPlan.target,
      },
    };

    await emitMonitoringEvent(resolvedRequest, {
      kind: "start",
      exportId,
      channelId: resolvedRequest.channelId,
    });

    try {
      await mkdir(outputPlan.outputDir, { recursive: true });

      const incrementalState = await loadIncrementalState(resolvedRequest, warnings);
      await flushWarnings(resolvedRequest);

      const api = this.config.apiClientFactory
        ? this.config.apiClientFactory({
            token: resolvedRequest.token,
            userAgent: this.config.userAgent,
          })
        : new DiscordApiClient({
            token: resolvedRequest.token,
            userAgent: this.config.userAgent,
          });

      const collected = await collectMessages({
        api,
        request: resolvedRequest,
        warnings,
      });

      limitations.push(...collected.limitations);

      await emitMonitoringEvent(resolvedRequest, {
        kind: "collect_progress",
        channelId: resolvedRequest.channelId,
        scanned: collected.messages.length,
      });

      let transcript = buildTranscript({
        channel: collected.channel,
        threads: collected.threads,
        messages: collected.messages,
        guild: collected.guild,
        guildChannels: collected.guildChannels,
        formats: resolvedRequest.formats.map(String),
        warnings,
        limitations,
        guildId: resolvedRequest.guildId,
        timezone: resolvedRequest.render?.timezone ?? "UTC",
        timestampFormat: resolvedRequest.render?.timestampFormat ?? "24h",
        theme: resolvedRequest.render?.theme ?? "discord-dark-like",
        readOnly: resolvedRequest.render?.readOnly ?? false,
        exporterVersion: EXPORTER_VERSION,
      });

      transcript.meta.watermarked = Boolean(resolvedRequest.render?.watermark);

      await mergeRecorderEvents(transcript, resolvedRequest, warnings);
      await flushWarnings(resolvedRequest);

      if (resolvedRequest.delta?.enabled) {
        const includeEdits = resolvedRequest.delta.includeEdits ?? true;
        const includeDeletes = resolvedRequest.delta.includeDeletes ?? true;

        if ((includeEdits || includeDeletes) && !resolvedRequest.recorder?.eventsFile) {
          limitations.push(
            "Delta edits/deletes merge is best-effort without recorder.eventsFile.",
          );
        }
      }

      const checkpointTranscript = cloneTranscriptWithMessages(transcript, [...transcript.messages]);
      const scannedMessages = transcript.messages.length;

      if (incrementalState?.lastMessageId) {
        const previousCount = transcript.messages.length;
        transcript.messages = transcript.messages.filter((message: TranscriptMessage) =>
          compareSnowflakes(message.id, incrementalState.lastMessageId) > 0,
        );
        const removed = previousCount - transcript.messages.length;
        warnings.push(`Incremental mode active: skipped ${removed} historical messages.`);
      }

      if (resolvedRequest.delta?.enabled) {
        const deltaCheckpoint = await loadDeltaCheckpoint(resolvedRequest, warnings);
        if (!deltaCheckpoint) {
          warnings.push("Delta mode enabled without checkpoint: full export this run; checkpoint will be created.");
        }

        const deltaResult = applyDeltaFilter({
          request: resolvedRequest,
          transcript,
          checkpoint: deltaCheckpoint,
        });
        transcript.messages = deltaResult.messages;

        if (deltaResult.skippedMessages > 0) {
          warnings.push(`Delta mode active: skipped ${deltaResult.skippedMessages} historical messages.`);
        }
      }

      transcript.messages = await applyFilters({
        messages: transcript.messages,
        request: resolvedRequest,
      });

      const redactionResult = applyRedaction(transcript, resolvedRequest.redaction);
      transcript = redactionResult.transcript;
      const redactionReport = redactionResult.report;

      const attachmentStats = await processAttachments({
        transcript,
        request: resolvedRequest,
        warnings,
      });

      const analyticsReport = resolvedRequest.analytics?.enabled
        ? generateAnalyticsReport(transcript, resolvedRequest.analytics)
        : undefined;

      const aiResult = await maybeGenerateAISummary(
        resolvedRequest,
        transcript,
        analyticsReport,
        this.aiProviders,
        warnings,
      );

      await flushWarnings(resolvedRequest);

      const outputBaseName = resolvedRequest.output.basename ?? buildBaseName(transcript.channel.id);
      const outputDir = outputPlan.outputDir;

      const chunks = splitTranscriptByPolicy(transcript, resolvedRequest.render?.splitPolicy);
      const requestedFormats = [...new Set(resolvedRequest.formats.map(String))];
      const artifacts: RenderArtifact[] = [];

      for (let index = 0; index < chunks.length; index += 1) {
        const chunkTranscript = chunks[index];
        if (!chunkTranscript) {
          continue;
        }
        const chunkBaseName =
          chunks.length === 1
            ? outputBaseName
            : `${outputBaseName}.part-${String(index + 1).padStart(3, "0")}`;

        const renderContext = {
          transcript: chunkTranscript,
          request: resolvedRequest,
          outputBaseName: chunkBaseName,
          outputDir,
          chunkIndex: index + 1,
          chunkTotal: chunks.length,
        };

        for (const format of requestedFormats) {
          if (format === "pdf" || format === "zip" || format === "analytics-json") {
            continue;
          }

          const result = await this.renderFormat(format, renderContext, warnings);
          artifacts.push(...result);

          await emitMonitoringEvent(resolvedRequest, {
            kind: "render_progress",
            channelId: resolvedRequest.channelId,
            format,
            chunk: index + 1,
            totalChunks: chunks.length,
          });
        }

        if (requestedFormats.includes("pdf")) {
          let htmlPath = artifacts.find(
            (item) => item.format === "html-single" && item.path.includes(chunkBaseName),
          )?.path;

          if (!htmlPath) {
            const transientHtml = await renderHtmlSingle(renderContext);
            htmlPath = transientHtml[0]?.path;
            if (requestedFormats.includes("html-single")) {
              artifacts.push(...transientHtml);
            }
          }

          if (!htmlPath) {
            throw new ValidationError("Unable to generate HTML source for PDF export.");
          }

          artifacts.push(...(await renderPdf(renderContext, htmlPath)));

          await emitMonitoringEvent(resolvedRequest, {
            kind: "render_progress",
            channelId: resolvedRequest.channelId,
            format: "pdf",
            chunk: index + 1,
            totalChunks: chunks.length,
          });
        }
      }

      if (analyticsReport && (requestedFormats.includes("analytics-json") || resolvedRequest.analytics?.enabled)) {
        artifacts.push(...(await renderAnalyticsJson(outputDir, outputBaseName, analyticsReport)));
      }

      if (requestedFormats.includes("zip") || resolvedRequest.output.compress) {
        const zipInputFiles = new Set<string>();

        for (const artifact of artifacts) {
          zipInputFiles.add(artifact.path);
        }

        for (const entry of transcript.attachmentsManifest) {
          if (entry.localPath) {
            zipInputFiles.add(entry.localPath);
          }
        }

        artifacts.push(
          ...(await renderZip(
            {
              transcript,
              request: resolvedRequest,
              outputBaseName,
              outputDir,
            },
            resolvedRequest,
            {
              files: [...zipInputFiles],
            },
          )),
        );
      }

      const stats: ExportStats = {
        scannedMessages,
        exportedMessages: transcript.messages.length,
        skippedMessages: scannedMessages - transcript.messages.length,
        durationMs: Date.now() - startedAt,
        attachmentsProcessed: attachmentStats.processed,
        attachmentsFailed: attachmentStats.failed,
        channelsProcessed: 1 + (resolvedRequest.threadIds?.length ?? 0),
      };

      const complianceArtifacts = await generateComplianceArtifacts({
        request: resolvedRequest,
        transcript,
        artifacts,
        stats,
        outputBaseName,
        outputDir,
        warnings,
        limitations,
        redactionReport,
        exportId,
      });

      artifacts.push(...complianceArtifacts.artifacts);

      const stateFile = await saveIncrementalStateIfNeeded(resolvedRequest, checkpointTranscript, warnings);
      const deltaCheckpointFile = await saveDeltaCheckpoint({
        request: resolvedRequest,
        transcript: checkpointTranscript,
        warnings,
      });

      await flushWarnings(resolvedRequest);

      transcript.warnings = [...warnings];
      transcript.limitations = [...limitations];

      const delivery = await deliverOutputTargets({
        request: resolvedRequest,
        artifacts,
        transcript,
        analyticsReport,
        aiResult,
        stats,
        databaseAdapters: this.databaseAdapters,
        warnings,
        limitations,
        exportId,
        manifest: complianceArtifacts.manifest,
      });

      await flushWarnings(resolvedRequest);

      const result: ExportResult = {
        files: artifacts,
        warnings,
        limitations,
        analyticsReport,
        aiResult,
        redactionReport,
        manifest: complianceArtifacts.manifest,
        checkpoints: {
          incrementalStateFile: stateFile ?? deltaCheckpointFile,
          lastMessageId: getMaxSnowflakeId(checkpointTranscript.messages),
          chunkCount: chunks.length,
        },
        stats,
        delivery,
      };

      await emitMonitoringEvent(resolvedRequest, {
        kind: "done",
        exportId,
        durationMs: Date.now() - startedAt,
      });

      return result;
    } catch (error) {
      await emitMonitoringEvent(resolvedRequest, {
        kind: "error",
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      if (outputPlan.temporary && !resolvedRequest.output.retainFiles) {
        await rm(outputPlan.outputDir, { recursive: true, force: true });
      }
    }
  }

  public async exportBatch(request: BatchExportRequest): Promise<BatchExportResult> {
    validateBatchRequest(request);

    const startedAt = Date.now();
    const exportId = createExportId();

    await emitMonitoringEvent(request, {
      kind: "start",
      exportId,
      batch: true,
    });

    try {
      const result = await exportBatchChannels(this, request);

      await emitMonitoringEvent(request, {
        kind: "done",
        exportId,
        durationMs: Date.now() - startedAt,
      });

      return result;
    } catch (error) {
      await emitMonitoringEvent(request, {
        kind: "error",
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  public async startLiveRecorder(options: RecorderStartOptions): Promise<LiveRecorderHandle> {
    return startLiveRecorder(options);
  }

  private async renderFormat(
    format: string,
    ctx: {
      transcript: TranscriptDocument;
      request: ExportRequest;
      outputBaseName: string;
      outputDir: string;
    },
    warnings: string[],
  ): Promise<RenderArtifact[]> {
    switch (format) {
      case "json-full":
        return renderJsonFull(ctx);
      case "json-clean":
        return renderJsonClean(ctx);
      case "txt":
        return renderText(ctx);
      case "md":
        return renderMarkdown(ctx);
      case "csv":
        return renderCsv(ctx);
      case "html-single":
        return renderHtmlSingle(ctx);
      case "html-bundle":
        return renderHtmlBundle(ctx);
      case "xml":
        return renderXml(ctx);
      case "sqlite":
        return renderSqlite(ctx);
      case "docx":
        return renderDocx(ctx);
      default: {
        const plugin = this.registry.get(format);
        if (!plugin) {
          warnings.push(`No renderer found for format '${format}'.`);
          return [];
        }

        return plugin.render(ctx);
      }
    }
  }
}

export function createExporter(config?: ExporterConfig): DiscordChatExporter {
  return new DiscordChatExporter(config);
}

