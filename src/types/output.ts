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

/**
 * Which panels to show in the full Discord-style HTML layout.
 * Omit or set a panel to true to show it; set to false to hide.
 * When omitted entirely, all panels are shown when guild data is available.
 */
export interface HtmlDiscordPanels {
  /** Show server list (guild icon/name) on the left. Default true. */
  serverList?: boolean;
  /** Show channel list sidebar. Default true. */
  channelList?: boolean;
  /** Show members sidebar on the right. Default true. */
  membersSidebar?: boolean;
}

export interface HtmlRenderOptions {
  mode?: "single-file" | "bundle" | "both";
  searchable?: boolean;
  accessibilityMode?: boolean;
  templatePath?: string;
  template?: string;
  /** Customize which Discord-style panels to show in HTML export. Omit to show all. */
  panels?: HtmlDiscordPanels;
}

export interface SplitPolicy {
  maxMessagesPerChunk?: number;
  maxBytesPerChunk?: number;
}

export type OutputTargetMode = "filesystem" | "discord-channel" | "both";

/**
 * Discord embed payload (subset of Discord API embed object).
 * Use with output.discord.embed / getEmbed / embeds / getEmbeds.
 * @see https://discord.com/developers/docs/resources/channel#embed-object
 */
export interface DiscordEmbedData {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  timestamp?: string;
  footer?: { text: string; icon_url?: string };
  image?: { url: string };
  thumbnail?: { url: string };
  author?: { name: string; url?: string; icon_url?: string };
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
}

export interface OutputDiscordOptions {
  channelId: string;
  token?: string;
  content?: string;
  /**
   * If true, the exporter will append (or inject) a readable list of the
   * attached artifacts' filenames into the Discord message content.
   *
   * You can also place `{{files}}` inside `content` to inject the file list
   * exactly where you want.
   */
  includeFileList?: boolean;
  /**
   * Function to build message content (and optionally use {{files}}).
   * Receives DiscordDeliveryContext; result can still contain {{files}} which is replaced.
   */
  getContent?: (ctx: import("./result.js").DiscordDeliveryContext) => string | Promise<string>;
  /**
   * Optional embed (e.g. rich "Transcript ready" card). Max 1 if using embed/getEmbed.
   */
  embed?: DiscordEmbedData;
  /**
   * Function to build a single embed from context.
   */
  getEmbed?: (ctx: import("./result.js").DiscordDeliveryContext) => DiscordEmbedData | Promise<DiscordEmbedData>;
  /**
   * Optional embeds (max 10 per message). Ignored if embed/getEmbed is set.
   */
  embeds?: DiscordEmbedData[];
  /**
   * Function to build embeds from context (max 10).
   */
  getEmbeds?: (ctx: import("./result.js").DiscordDeliveryContext) => DiscordEmbedData[] | Promise<DiscordEmbedData[]>;
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

export type StorageProviderKind = "s3" | "gcs" | "azure-blob";

export interface OutputStorageOptions {
  enabled?: boolean;
  concurrency?: number;
  strict?: boolean;
  providers: StorageTarget[];
}

export type StorageTarget =
  | {
      kind: "s3";
      bucket: string;
      region?: string;
      endpoint?: string;
      keyPrefix?: string;
      credentialsFromEnv?: boolean;
    }
  | {
      kind: "gcs";
      bucket: string;
      keyPrefix?: string;
      projectId?: string;
      credentialsJsonPath?: string;
    }
  | {
      kind: "azure-blob";
      account: string;
      container: string;
      keyPrefix?: string;
      connectionString?: string;
    };

export interface StorageUploadResult {
  provider: StorageProviderKind;
  objectKey: string;
  url?: string;
  etag?: string;
}

export interface OutputWebhookOptions {
  enabled?: boolean;
  strict?: boolean;
  targets: WebhookTarget[];
  retry?: {
    attempts?: number;
    backoffMs?: number;
  };
}

export type WebhookTarget =
  | {
      kind: "generic";
      url: string;
      method?: "POST" | "PUT";
      headers?: Record<string, string>;
      secretHeader?: { name: string; value: string };
    }
  | {
      kind: "discord";
      url: string;
      username?: string;
      avatarUrl?: string;
    }
  | {
      kind: "slack";
      url: string;
      channel?: string;
      username?: string;
    };

export interface AttachmentOptions {
  include?: boolean;
  mode?: "external-link" | "local-download" | "both" | "base64-inline";
  outputFolder?: string;
  maxBase64Bytes?: number;
  downloadConcurrency?: number;
  retry?: number;
}

export interface EncryptionOptions {
  enabled?: boolean;
  password?: string;
  method?: "zip-aes256";
}

export interface IncrementalOptions {
  enabled?: boolean;
  stateFile?: string;
}

export interface OutputOptions {
  dir?: string;
  basename?: string;
  compress?: boolean;
  target?: OutputTargetMode;
  retainFiles?: boolean;
  discord?: OutputDiscordOptions;
  database?: OutputDatabaseOptions;
  storage?: OutputStorageOptions;
  webhooks?: OutputWebhookOptions;
  encryption?: EncryptionOptions;
  incremental?: IncrementalOptions;
}

export interface IncrementalState {
  channelId: string;
  guildId?: string;
  exportedAt: string;
  lastMessageId: string;
  exportedMessages: number;
}
