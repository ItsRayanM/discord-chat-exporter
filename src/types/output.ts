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
  templatePath?: string;
  template?: string;
}

export interface SplitPolicy {
  maxMessagesPerChunk?: number;
  maxBytesPerChunk?: number;
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
