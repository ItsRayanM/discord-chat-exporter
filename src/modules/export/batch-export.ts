import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type {
  BatchExportRequest,
  BatchExportResult,
  ExportRequest,
  ExportResult,
  RenderArtifact,
} from "@/types.js";
import { hashFileSha256 } from "@/modules/transcript/index.js";
import { createConcurrencyLimiter } from "@/shared/async/concurrency.js";

interface BatchExporter {
  exportChannel(request: ExportRequest): Promise<ExportResult>;
}

export async function exportBatchChannels(
  exporter: BatchExporter,
  request: BatchExportRequest,
): Promise<BatchExportResult> {
  const startedAt = Date.now();
  const outputDirName = request.batch?.outputDirName ?? `batch-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const concurrency = Math.max(1, request.batch?.concurrency ?? 3);
  const includeMasterIndex = request.batch?.includeMasterIndex ?? true;
  const includeMergedTranscript = request.batch?.includeMergedTranscript ?? false;

  const baseOutputDir = request.output.dir?.trim() ?? "./exports";
  const batchRootDir = join(baseOutputDir, outputDirName);
  await mkdir(batchRootDir, { recursive: true });

  const channels: BatchExportResult["channels"] = request.channelIds.map((channelId) => ({
    channelId,
  }));

  const limit = createConcurrencyLimiter(concurrency);

  await Promise.all(
    request.channelIds.map((channelId, index) =>
      limit(async () => {
        const channelOutputDir = join(batchRootDir, channelId);
        await mkdir(channelOutputDir, { recursive: true });

        const channelRequest: ExportRequest = {
          ...request,
          channelId,
          output: {
            ...request.output,
            dir: channelOutputDir,
            basename: request.output.basename
              ? `${request.output.basename}-${channelId}`
              : undefined,
          },
        };

        delete (channelRequest as { batch?: unknown }).batch;
        delete (channelRequest as { channelIds?: unknown }).channelIds;

        try {
          const result = await exporter.exportChannel(channelRequest);
          const channelSlot = channels[index];
          if (channelSlot) {
            channelSlot.result = result;
          }
        } catch (error) {
          const channelSlot = channels[index];
          if (channelSlot) {
            channelSlot.error = error instanceof Error ? error.message : String(error);
          }
        }
      }),
    ),
  );

  let masterIndex: RenderArtifact | undefined;

  if (includeMasterIndex) {
    masterIndex = await createMasterIndexArtifact(batchRootDir, channels);
  }

  if (includeMergedTranscript) {
    await createMergedTranscriptArtifact(batchRootDir, channels);
  }

  const succeeded = channels.filter((item) => item.result).length;
  const failed = channels.length - succeeded;

  return {
    channels,
    masterIndex,
    stats: {
      totalChannels: channels.length,
      succeeded,
      failed,
      durationMs: Date.now() - startedAt,
    },
  };
}

async function createMasterIndexArtifact(
  batchRootDir: string,
  channels: BatchExportResult["channels"],
): Promise<RenderArtifact> {
  const payload = {
    generatedAt: new Date().toISOString(),
    channels: channels.map((entry) => ({
      channelId: entry.channelId,
      ok: Boolean(entry.result),
      error: entry.error,
      files:
        entry.result?.files.map((file) => ({
          format: file.format,
          path: file.path,
          size: file.size,
          checksumSha256: file.checksumSha256,
        })) ?? [],
      warnings: entry.result?.warnings ?? [],
      limitations: entry.result?.limitations ?? [],
      stats: entry.result?.stats,
    })),
  };

  const path = join(batchRootDir, "master-index.json");
  await writeFile(path, JSON.stringify(payload, null, 2), "utf8");
  const info = await hashFileSha256(path);

  return {
    format: "batch-master-index",
    path,
    contentType: "application/json",
    size: info.size,
    checksumSha256: info.checksum,
  };
}

async function createMergedTranscriptArtifact(
  batchRootDir: string,
  channels: BatchExportResult["channels"],
): Promise<void> {
  const mergedMessages: Array<Record<string, unknown>> = [];

  for (const channel of channels) {
    const jsonFull = channel.result?.files.find((file) => file.format === "json-full");
    if (!jsonFull) {
      continue;
    }

    try {
      const raw = await readFile(jsonFull.path, "utf8");
      const parsed = JSON.parse(raw) as { messages?: unknown[]; channel?: { id?: string } };
      const messages = Array.isArray(parsed.messages) ? parsed.messages : [];

      for (const message of messages) {
        if (message && typeof message === "object") {
          mergedMessages.push({
            channelId: parsed.channel?.id ?? channel.channelId,
            ...(message as Record<string, unknown>),
          });
        }
      }
    } catch {
      continue;
    }
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    messageCount: mergedMessages.length,
    messages: mergedMessages,
  };

  const path = join(batchRootDir, "merged-transcript.json");
  await writeFile(path, JSON.stringify(payload, null, 2), "utf8");
}
