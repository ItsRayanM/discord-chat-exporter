# Full Type Definitions (`src/types.ts`)

This is a full reference copy of the current exported type definitions.
Source of truth remains `src/types.ts`.

```ts
export type OutputFormat =
  | "json-full"
  | "json-clean"
  | "csv"
  | "xml"
  | "sqlite"
  | "txt"
  | "md"
  | "html-single"
  | "html-bundle"
  | "pdf"
  | "docx"
  | "zip"
  | "analytics-json";

export type MessagePredicate = (
  message: TranscriptMessage,
  ctx: FilterContext,
) => boolean | Promise<boolean>;

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
}

export interface FilterContextMaps {
  categoryByChannelId?: Record<string, string>;
  ticketByChannelId?: Record<string, string>;
}

export interface AnalyticsOptions {
  enabled?: boolean;
  includeHeatmap?: boolean;
  topWordsLimit?: number;
  topMentionedLimit?: number;
  highlightCount?: number;
  responseWindowMinutes?: number;
  ai?: AIRequestOptions;
}

export interface AIRequestOptions {
  enabled?: boolean;
  providerId?: string;
  prompt?: string;
  maxHighlights?: number;
  temperature?: number;
}

export interface RecorderMergeOptions {
  eventsFile?: string;
  includeDeletedPlaceholders?: boolean;
}

export interface RenderOptions {
  timezone?: string;
  timestampFormat?: "12h" | "24h";
  theme?: "discord-dark-like" | "discord-light-like" | "high-contrast" | "minimal" | "compact";
  html?: HtmlRenderOptions;
  watermark?: string;
  readOnly?: boolean;
  rtl?: boolean;
  customCss?: string;
  showUserIds?: boolean;
  avatarSize?: number;
  includeTableOfContents?: boolean;
  splitPolicy?: SplitPolicy;
}

export interface HtmlRenderOptions {
  mode?: "single-file" | "bundle" | "both";
  searchable?: boolean;
  accessibilityMode?: boolean;
}

export interface SplitPolicy {
  maxMessagesPerChunk?: number;
  maxBytesPerChunk?: number;
}

export interface OutputOptions {
  dir?: string;
  basename?: string;
  compress?: boolean;
  target?: OutputTargetMode;
  retainFiles?: boolean;
  discord?: OutputDiscordOptions;
  database?: OutputDatabaseOptions;
  encryption?: EncryptionOptions;
  incremental?: IncrementalOptions;
}

export type OutputTargetMode = "filesystem" | "discord-channel" | "both";

export interface OutputDiscordOptions {
  channelId: string;
  token?: string;
  content?: string;
}

export interface OutputDatabaseOptions {
  enabled?: boolean;
  driver?: string;
  sqlitePath?: string;
  connectionString?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  databaseName?: string;
  table?: string;
  collection?: string;
  tls?: boolean;
  options?: Record<string, unknown>;
}

export interface IncrementalOptions {
  enabled?: boolean;
  stateFile?: string;
}

export interface EncryptionOptions {
  enabled?: boolean;
  password?: string;
  method?: "zip-aes256";
}

export interface AttachmentOptions {
  include?: boolean;
  mode?: "external-link" | "local-download" | "both" | "base64-inline";
  outputFolder?: string;
  maxBase64Bytes?: number;
  downloadConcurrency?: number;
  retry?: number;
}

export interface FilterGroup {
  op: "AND" | "OR";
  conditions: Array<FilterCondition | FilterGroup>;
}

export type FilterCondition =
  | { kind: "authorId"; in: string[] }
  | { kind: "username"; in: string[]; caseSensitive?: boolean }
  | { kind: "discriminator"; in: string[] }
  | { kind: "roleId"; in: string[] }
  | { kind: "authorType"; value: "bot" | "human" }
  | { kind: "betweenUsers"; users: [string, string] }
  | { kind: "date"; after?: string; before?: string }
  | { kind: "relativeTime"; lastDays?: number; lastHours?: number; lastMessages?: number }
  | { kind: "snowflake"; after?: string; before?: string }
  | {
      kind: "contentContains";
      terms: string[];
      mode: "any" | "all";
      caseSensitive?: boolean;
    }
  | { kind: "regex"; pattern: string; flags?: string }
  | {
      kind: "has";
      value:
        | "link"
        | "attachment"
        | "image"
        | "video"
        | "embed"
        | "reaction"
        | "emoji"
        | "mention"
        | "codeblock";
    }
  | { kind: "length"; min?: number; max?: number }
  | { kind: "messageType"; in: number[] }
  | {
      kind: "state";
      value:
        | "edited"
        | "deleted"
        | "pinned"
        | "thread"
        | "reply"
        | "slash"
        | "system"
        | "poll"
        | "components";
    }
  | {
      kind: "scope";
      channelIds?: string[];
      categoryIds?: string[];
      threadIds?: string[];
      ticketIds?: string[];
    };

export interface FilterContext {
  channelId: string;
  categoryByChannelId: Record<string, string>;
  ticketByChannelId: Record<string, string>;
  now: Date;
  indexFromEnd: number;
}

export interface RenderArtifact {
  format: string;
  path: string;
  contentType: string;
  size: number;
  checksumSha256: string;
}

export interface ExportResult {
  files: RenderArtifact[];
  warnings: string[];
  limitations: string[];
  stats: ExportStats;
  analyticsReport?: AnalyticsReport;
  aiResult?: AIResult;
  checkpoints?: ExportCheckpoints;
  delivery?: ExportDeliveryResult;
}

export interface ExportDeliveryResult {
  discord?: DiscordDeliveryResult;
  database?: DatabaseDeliveryResult;
}

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

export interface ExportCheckpoints {
  incrementalStateFile?: string;
  lastMessageId?: string;
  chunkCount: number;
}

export interface ExportStats {
  scannedMessages: number;
  exportedMessages: number;
  skippedMessages: number;
  durationMs: number;
  attachmentsProcessed: number;
  attachmentsFailed: number;
  channelsProcessed: number;
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

export interface TranscriptDocument {
  version: "1";
  exportedAt: string;
  exporter: {
    name: string;
    version: string;
  };
  meta: TranscriptMeta;
  channel: TranscriptChannel;
  threads: TranscriptChannel[];
  participants: TranscriptParticipant[];
  messages: TranscriptMessage[];
  attachmentsManifest: AttachmentManifestEntry[];
  eventLog?: TranscriptEvent[];
  limitations: string[];
  warnings: string[];
}

export interface TranscriptMeta {
  guildId?: string;
  sourceChannelIds: string[];
  intentsSatisfied: {
    messageContent: boolean;
  };
  formats: Array<string>;
  timezone: string;
  timestampFormat: "12h" | "24h";
  renderTheme: string;
  readOnly: boolean;
  watermarked: boolean;
  chunk?: {
    index: number;
    total: number;
  };
}

export interface TranscriptChannel {
  id: string;
  name?: string;
  type?: number;
  parentId?: string;
  ownerId?: string;
  archived?: boolean;
  createdAt?: string;
}

export interface TranscriptParticipant {
  id: string;
  username: string;
  globalName?: string;
  discriminator?: string;
  avatarUrl?: string;
  bot?: boolean;
}

export interface TranscriptAttachment {
  id: string;
  filename: string;
  url: string;
  proxyUrl?: string;
  contentType?: string;
  size: number;
  width?: number | null;
  height?: number | null;
  durationSecs?: number;
  waveform?: string;
  flags?: number;
  description?: string;
  spoiler: boolean;
  localPath?: string;
  dataUrl?: string;
}

export interface TranscriptMessage {
  id: string;
  channelId: string;
  guildId?: string;
  type: number;
  createdAt: string;
  editedAt?: string | null;
  pinned: boolean;
  flags?: number;
  deleted?: boolean;
  author?: TranscriptParticipant;
  content: string;
  contentRendered?: string;
  mentions: {
    everyone: boolean;
    users: TranscriptParticipant[];
    roles: string[];
    channels: string[];
  };
  attachments: TranscriptAttachment[];
  embeds: unknown[];
  reactions: unknown[];
  components: unknown[];
  stickerItems: unknown[];
  poll?: unknown;
  interactionMetadata?: unknown;
  thread?: TranscriptChannel;
  messageReference?: {
    messageId?: string;
    channelId?: string;
    guildId?: string;
  };
  referencedMessage?: unknown;
  raw: Record<string, unknown>;
}

export interface AttachmentManifestEntry {
  id: string;
  messageId: string;
  sourceUrl: string;
  localPath?: string;
  dataUrl?: string;
  sha256?: string;
  size: number;
  contentType?: string;
  status: "linked" | "downloaded" | "inlined" | "failed";
  error?: string;
}

export interface TranscriptEvent {
  kind:
    | "message_create"
    | "message_update"
    | "message_delete"
    | "reaction_add"
    | "reaction_remove"
    | "interaction";
  timestamp: string;
  channelId: string;
  messageId?: string;
  payload: Record<string, unknown>;
}

export interface RenderContext {
  transcript: TranscriptDocument;
  request: ExportRequest;
  outputBaseName: string;
  outputDir: string;
  chunkIndex?: number;
  chunkTotal?: number;
}

export interface RendererPlugin {
  id: string;
  format: OutputFormat | string;
  supportsStreaming: boolean;
  render(ctx: RenderContext): Promise<RenderArtifact[]>;
}

export interface RecorderStartOptions {
  token: string;
  outFile: string;
  guildIds?: string[];
  channelIds?: string[];
}

export interface LiveRecorderHandle {
  stop: () => Promise<void>;
}

export interface TicketCloseHandlerOptions {
  token: string;
  logChannelId: string;
  formats?: Array<OutputFormat | string>;
  outputDir?: string;
  archiveThread?: boolean;
  closeReason?: string;
}

export interface AnalyticsReport {
  exportedAt: string;
  messageCountPerUser: Array<{ userId: string; username: string; count: number }>;
  attachmentStats: {
    total: number;
    byContentType: Array<{ contentType: string; count: number }>;
    totalBytes: number;
  };
  reactionStats: {
    totalReactionEntries: number;
    messagesWithReactions: number;
  };
  wordFrequency: Array<{ word: string; count: number }>;
  activityTimelineByHour: Array<{ hour: number; count: number }>;
  peakActivityHours: Array<{ hour: number; count: number }>;
  topMentionedUsers: Array<{ userId: string; username: string; count: number }>;
  responseTimeMetrics: {
    sampledTransitions: number;
    averageSeconds: number;
    medianSeconds: number;
    p95Seconds: number;
  };
  conversationHeatmap?: Array<{ day: string; hour: number; count: number }>;
  highlights: Array<{ messageId: string; reason: string }>;
}

export interface AIResult {
  providerId: string;
  summary: string;
  highlights: string[];
  model?: string;
}

export interface AIProviderContext {
  transcript: TranscriptDocument;
  report?: AnalyticsReport;
  options?: AIRequestOptions;
}

export interface AIProvider {
  id: string;
  summarize(ctx: AIProviderContext): Promise<AIResult>;
}

export interface IncrementalState {
  channelId: string;
  guildId?: string;
  exportedAt: string;
  lastMessageId: string;
  exportedMessages: number;
}

```
