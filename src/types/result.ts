import type { ExportRequest } from "./request.js";
import type { TranscriptDocument } from "./transcript.js";
import type { RenderArtifact } from "./render.js";
import type { AnalyticsReport } from "./analytics.js";
import type { AIResult } from "./ai.js";
import type { RedactionReport } from "./redaction.js";
import type { ComplianceManifest } from "./compliance.js";
import type {
  StorageProviderKind,
  StorageUploadResult,
  WebhookTarget,
  OutputDatabaseOptions,
} from "./output.js";
import type { ExportStats, ExportCheckpoints } from "./stats.js";

export type { ExportStats, ExportCheckpoints } from "./stats.js";

export interface DiscordDeliveryResult {
  channelId: string;
  messageIds: string[];
  uploadedFiles: number;
}

export interface DatabaseDeliveryResult {
  driver: string;
  exportId: string | number;
  location: string;
  metadata?: Record<string, unknown>;
}

export interface StorageDeliveryResult {
  uploads: StorageUploadResult[];
  failures: Array<{ provider: StorageProviderKind; objectKey: string; error: string }>;
}

export interface WebhookDeliveryResult {
  delivered: Array<{ kind: WebhookTarget["kind"]; url: string; status: number }>;
  failures: Array<{ kind: WebhookTarget["kind"]; url: string; error: string }>;
}

export interface ExportDeliveryResult {
  discord?: DiscordDeliveryResult;
  database?: DatabaseDeliveryResult;
  storage?: StorageDeliveryResult;
  webhooks?: WebhookDeliveryResult;
}

export interface ExportResult {
  readonly files: readonly RenderArtifact[];
  readonly warnings: readonly string[];
  readonly limitations: readonly string[];
  readonly stats: ExportStats;
  readonly analyticsReport?: AnalyticsReport;
  readonly aiResult?: AIResult;
  readonly checkpoints?: ExportCheckpoints;
  readonly delivery?: ExportDeliveryResult;
  readonly redactionReport?: RedactionReport;
  readonly manifest?: ComplianceManifest;
}

export interface ExporterConfig {
  userAgent?: string;
}

export interface DatabaseDeliveryContext {
  database: OutputDatabaseOptions;
  request: ExportRequest;
  transcript: TranscriptDocument;
  artifacts: RenderArtifact[];
  analyticsReport?: AnalyticsReport;
  aiResult?: AIResult;
  stats: ExportStats;
}

export interface DatabaseDeliveryAdapter {
  id: string;
  persist(ctx: DatabaseDeliveryContext): Promise<DatabaseDeliveryResult>;
}

export interface BatchExportResult {
  channels: Array<{
    channelId: string;
    result?: ExportResult;
    error?: string;
  }>;
  masterIndex?: RenderArtifact;
  stats: {
    totalChannels: number;
    succeeded: number;
    failed: number;
    durationMs: number;
  };
}