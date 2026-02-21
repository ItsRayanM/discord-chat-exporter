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

/** Guild/server info for full Discord UI. */
export interface TranscriptGuild {
  id: string;
  name?: string;
  iconUrl?: string;
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
  /** Guild/server for full Discord UI (when export included guild fetch). */
  guild?: TranscriptGuild;
  /** Guild channels list for full Discord UI (when export included guild fetch). */
  guildChannels?: TranscriptChannel[];
  participants: TranscriptParticipant[];
  messages: TranscriptMessage[];
  attachmentsManifest: AttachmentManifestEntry[];
  eventLog?: TranscriptEvent[];
  limitations: string[];
  warnings: string[];
}
