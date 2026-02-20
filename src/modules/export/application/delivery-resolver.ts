import type {
  AIResult,
  AnalyticsReport,
  ComplianceManifest,
  DatabaseDeliveryAdapter,
  ExportDeliveryResult,
  ExportRequest,
  ExportStats,
  RenderArtifact,
  TranscriptDocument,
} from "@/types.js";
import {
  deliverArtifactsToDiscordChannel,
  persistExportToDatabase,
  uploadArtifactsToStorage,
  deliverWebhookTargets,
} from "@/modules/delivery/index.js";
import { ValidationError } from "@/shared/errors/index.js";
import { emitMonitoringEvent } from "@/modules/export/monitoring.js";

export interface DeliverOutputTargetsOptions {
  request: ExportRequest;
  artifacts: RenderArtifact[];
  transcript: TranscriptDocument;
  analyticsReport?: AnalyticsReport;
  aiResult?: AIResult;
  stats: ExportStats;
  databaseAdapters: Map<string, DatabaseDeliveryAdapter>;
  warnings: string[];
  limitations: string[];
  exportId: string;
  manifest?: ComplianceManifest;
}

/**
 * Dispatches artifacts to all configured output targets (Discord, database, storage, webhooks).
 * Returns the combined delivery result, or undefined if no target was active.
 */
export async function deliverOutputTargets(
  options: DeliverOutputTargetsOptions,
): Promise<ExportDeliveryResult | undefined> {
  const {
    request,
    artifacts,
    transcript,
    analyticsReport,
    aiResult,
    stats,
    databaseAdapters,
    warnings,
    limitations,
    exportId,
    manifest,
  } = options;

  const target = request.output.target ?? "filesystem";
  const delivery: ExportDeliveryResult = {};

  if (target === "discord-channel" || target === "both") {
    const discord = request.output.discord;
    if (!discord?.channelId?.trim()) {
      throw new ValidationError("output.discord.channelId is required for discord delivery");
    }
    await emitMonitoringEvent(request, {
      kind: "delivery_progress",
      target: "discord",
      detail: `Uploading ${artifacts.length} artifacts to channel ${discord.channelId}`,
    });
    delivery.discord = await deliverArtifactsToDiscordChannel({
      token: discord.token?.trim() || request.token,
      delivery: discord,
      artifacts,
    });
  }

  if (request.output.database?.enabled) {
    await emitMonitoringEvent(request, {
      kind: "delivery_progress",
      target: "database",
      detail: `Persisting export via driver ${request.output.database.driver ?? "sqlite"}`,
    });
    delivery.database = await persistExportToDatabase({
      database: request.output.database,
      request,
      transcript,
      artifacts,
      analyticsReport,
      aiResult,
      stats,
      adapters: databaseAdapters,
    });
  }

  if (request.output.storage?.enabled) {
    await emitMonitoringEvent(request, {
      kind: "delivery_progress",
      target: "storage",
      detail: `Uploading artifacts to ${request.output.storage.providers.length} storage targets`,
    });
    delivery.storage = await uploadArtifactsToStorage({
      request,
      artifacts,
      exportId,
      warnings,
    });
  }

  if (request.output.webhooks?.enabled) {
    await emitMonitoringEvent(request, {
      kind: "delivery_progress",
      target: "webhook",
      detail: `Sending payload to ${request.output.webhooks.targets.length} webhook targets`,
    });
    delivery.webhooks = await deliverWebhookTargets({
      request,
      artifacts,
      exportId,
      stats,
      warnings,
      limitations,
      manifest,
      storage: delivery.storage,
    });
  }

  return delivery.discord || delivery.database || delivery.storage || delivery.webhooks
    ? delivery
    : undefined;
}
