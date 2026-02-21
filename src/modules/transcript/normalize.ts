/**
 * Builds a TranscriptDocument from raw Discord API channel/thread/message data.
 */
import type {
  TranscriptDocument,
  TranscriptChannel,
  TranscriptGuild,
  TranscriptMessage,
  TranscriptParticipant,
  TranscriptAttachment,
  AttachmentManifestEntry,
} from "@/types.js";
import type { RawChannel, RawGuild, RawMessage } from "@/modules/discord/discord-api.js";
import { EXPORTER_VERSION } from "@/shared/constants.js";

function rawChannelToTranscriptChannel(raw: RawChannel): TranscriptChannel {
  return {
    id: raw.id,
    name: raw.name ?? undefined,
    type: raw.type,
    parentId: raw.parent_id ?? undefined,
    ownerId: raw.owner_id ?? undefined,
    archived: raw.archived,
    createdAt: raw.thread_metadata?.create_timestamp,
  };
}

function rawAuthorToParticipant(author: RawMessage["author"]): TranscriptParticipant | undefined {
  if (!author) return undefined;
  const avatarUrl = author.avatar
    ? `https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}.png?size=32`
    : undefined;
  return {
    id: author.id,
    username: author.username ?? "unknown",
    globalName: author.global_name,
    discriminator: author.discriminator,
    avatarUrl,
    bot: author.bot,
  };
}

function rawAttachmentToTranscriptAttachment(att: {
  id: string;
  filename: string;
  url: string;
  proxy_url?: string;
  content_type?: string;
  size?: number;
  width?: number | null;
  height?: number | null;
  duration_secs?: number;
  description?: string;
}): TranscriptAttachment {
  return {
    id: att.id,
    filename: att.filename,
    url: att.url,
    proxyUrl: att.proxy_url,
    contentType: att.content_type,
    size: att.size ?? 0,
    width: att.width ?? null,
    height: att.height ?? null,
    durationSecs: att.duration_secs,
    description: att.description,
    spoiler: att.filename?.startsWith("SPOILER_") ?? false,
  };
}

function rawMessageToTranscriptMessage(raw: RawMessage): TranscriptMessage {
  const author = rawAuthorToParticipant(raw.author);
  const attachments: TranscriptAttachment[] = (raw.attachments ?? []).map((a) =>
    rawAttachmentToTranscriptAttachment(a),
  );
  return {
    id: raw.id,
    channelId: raw.channel_id,
    guildId: raw.guild_id,
    type: raw.type,
    createdAt: raw.timestamp,
    editedAt: raw.edited_timestamp ?? null,
    pinned: raw.pinned ?? false,
    flags: raw.flags,
    content: raw.content ?? "",
    author,
    mentions: {
      everyone: raw.mention_everyone ?? false,
      users: (raw.mentions ?? []).map((u) => ({ id: u.id, username: u.username })),
      roles: [],
      channels: [],
    },
    attachments,
    embeds: raw.embeds ?? [],
    reactions: raw.reactions ?? [],
    components: raw.components ?? [],
    stickerItems: raw.sticker_items ?? [],
    messageReference: raw.message_reference
      ? {
          messageId: raw.message_reference.message_id,
          channelId: raw.message_reference.channel_id,
          guildId: raw.message_reference.guild_id,
        }
      : undefined,
    raw: raw as Record<string, unknown>,
  };
}

function rawGuildToTranscriptGuild(raw: RawGuild): TranscriptGuild {
  const iconUrl = raw.icon
    ? `https://cdn.discordapp.com/icons/${raw.id}/${raw.icon}.png?size=128`
    : undefined;
  return {
    id: raw.id,
    name: raw.name,
    iconUrl,
  };
}

export function buildTranscript(options: {
  channel: RawChannel;
  threads: RawChannel[];
  messages: RawMessage[];
  guild?: RawGuild;
  guildChannels?: RawChannel[];
  formats: string[];
  warnings: string[];
  limitations: string[];
  guildId?: string;
  timezone?: string;
  timestampFormat?: "12h" | "24h";
  theme?: string;
  readOnly?: boolean;
  exporterVersion?: string;
}): TranscriptDocument {
  const {
    channel,
    threads,
    messages,
    guild: rawGuild,
    guildChannels: rawGuildChannels,
    formats,
    limitations,
    timezone = "UTC",
    timestampFormat = "24h",
    theme = "discord-dark-like",
    readOnly = false,
    exporterVersion = EXPORTER_VERSION,
  } = options;

  const transcriptMessages = messages.map((m) => rawMessageToTranscriptMessage(m));
  const participantsMap = new Map<string, TranscriptParticipant>();
  for (const m of transcriptMessages) {
    if (m.author) participantsMap.set(m.author.id, m.author);
    for (const u of m.mentions.users) {
      if (!participantsMap.has(u.id)) participantsMap.set(u.id, u);
    }
  }
  const participants = [...participantsMap.values()];

  const attachmentsManifest: AttachmentManifestEntry[] = [];
  for (const m of transcriptMessages) {
    for (const a of m.attachments) {
      attachmentsManifest.push({
        id: a.id,
        messageId: m.id,
        sourceUrl: a.url,
        size: a.size,
        contentType: a.contentType,
        status: "linked",
      });
    }
  }

  return {
    version: "1",
    exportedAt: new Date().toISOString(),
    exporter: { name: "@rayanmustafa/discord-chat-exporter", version: exporterVersion },
    meta: {
      sourceChannelIds: [channel.id, ...threads.map((t) => t.id)],
      guildId: rawGuild?.id,
      intentsSatisfied: { messageContent: true },
      formats,
      timezone,
      timestampFormat,
      renderTheme: theme,
      readOnly,
      watermarked: false,
    },
    channel: rawChannelToTranscriptChannel(channel),
    threads: threads.map(rawChannelToTranscriptChannel),
    guild: rawGuild ? rawGuildToTranscriptGuild(rawGuild) : undefined,
    guildChannels: rawGuildChannels?.map(rawChannelToTranscriptChannel),
    participants,
    messages: transcriptMessages,
    attachmentsManifest,
    limitations: [...limitations],
    warnings: [...(options.warnings ?? [])],
  };
}
