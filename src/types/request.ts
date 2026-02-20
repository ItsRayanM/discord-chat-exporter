import type { OutputFormat } from "./formats.js";
import type { FilterGroup } from "./filters.js";
import type { MessagePredicate } from "./filters.js";
import type { FilterContextMaps } from "./filters.js";
import type {
  AttachmentOptions,
  OutputOptions,
  RenderOptions,
  IncrementalOptions,
} from "./output.js";
import type { RedactionOptions } from "./redaction.js";
import type { DeltaOptions } from "./delta.js";
import type { ComplianceOptions } from "./compliance.js";
import type { MonitoringOptions } from "./monitoring.js";
import type { AnalyticsOptions } from "./analytics.js";
import type { RecorderMergeOptions } from "./recorder.js";

export interface ExportRequest {
  token: string;
  guildId?: string;
  channelId: string;
  threadIds?: string[];
  formats: Array<OutputFormat | string>;
  filters?: FilterGroup;
  predicate?: MessagePredicate;
  attachments?: AttachmentOptions;
  render?: RenderOptions;
  output: OutputOptions;
  recorder?: RecorderMergeOptions;
  analytics?: AnalyticsOptions;
  filterContext?: FilterContextMaps;
  redaction?: RedactionOptions;
  delta?: DeltaOptions;
  compliance?: ComplianceOptions;
  monitoring?: MonitoringOptions;
}

export interface BatchExportRequest extends Omit<ExportRequest, "channelId"> {
  channelIds: string[];
  batch?: BatchExportOptions;
}

export interface BatchExportOptions {
  outputDirName?: string;
  concurrency?: number;
  includeMasterIndex?: boolean;
  includeMergedTranscript?: boolean;
}