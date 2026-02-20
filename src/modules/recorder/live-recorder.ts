import { mkdir } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { dirname } from "node:path";
import {
  Client,
  GatewayIntentBits,
  Partials,
  type Message,
  type PartialMessageReaction,
  type PartialUser,
  type MessageReaction,
  type PartialMessage,
  type User,
} from "discord.js";
import type { LiveRecorderHandle, RecorderStartOptions, TranscriptEvent } from "@/types.js";

export async function startLiveRecorder(
  options: RecorderStartOptions,
): Promise<LiveRecorderHandle> {
  await mkdir(dirname(options.outFile), { recursive: true });
  const output = createWriteStream(options.outFile, { flags: "a" });

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [Partials.Channel, Partials.Message, Partials.Reaction, Partials.User],
  });

  const writeEvent = (event: TranscriptEvent): void => {
    output.write(`${JSON.stringify(event)}\n`);
  };

  client.on("messageCreate", (message) => {
    if (!isAllowed(message.guildId ?? undefined, message.channelId, options)) {
      return;
    }

    writeEvent({
      kind: "message_create",
      timestamp: new Date().toISOString(),
      channelId: message.channelId,
      messageId: message.id,
      payload: {
        id: message.id,
        channel_id: message.channelId,
        guild_id: message.guildId,
        content: message.content,
        author_id: message.author?.id,
      },
    });
  });

  client.on("messageUpdate", (_oldMessage, newMessage) => {
    const message = newMessage as Message | PartialMessage;
    if (!isAllowed(message.guildId ?? undefined, message.channelId, options)) {
      return;
    }

    writeEvent({
      kind: "message_update",
      timestamp: new Date().toISOString(),
      channelId: message.channelId,
      messageId: message.id,
      payload: {
        id: message.id,
        channel_id: message.channelId,
        guild_id: message.guildId,
        content: message.content,
        edited_timestamp: new Date().toISOString(),
      },
    });
  });

  client.on("messageDelete", (message) => {
    const candidate = message as Message | PartialMessage;
    if (!isAllowed(candidate.guildId ?? undefined, candidate.channelId, options)) {
      return;
    }

    writeEvent({
      kind: "message_delete",
      timestamp: new Date().toISOString(),
      channelId: candidate.channelId,
      messageId: candidate.id,
      payload: {
        id: candidate.id,
        channel_id: candidate.channelId,
        guild_id: candidate.guildId,
      },
    });
  });

  client.on("messageReactionAdd", (reaction, user) => {
    writeReactionEvent("reaction_add", reaction, user, options, writeEvent);
  });

  client.on("messageReactionRemove", (reaction, user) => {
    writeReactionEvent("reaction_remove", reaction, user, options, writeEvent);
  });

  await client.login(options.token);

  return {
    stop: async () => {
      await client.destroy();
      await new Promise<void>((resolve) => {
        output.end(() => resolve());
      });
    },
  };
}

function writeReactionEvent(
  kind: "reaction_add" | "reaction_remove",
  reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser,
  options: RecorderStartOptions,
  writeEvent: (event: TranscriptEvent) => void,
): void {
  const channelId = reaction.message.channelId;
  const guildId = reaction.message.guildId ?? undefined;

  if (!isAllowed(guildId, channelId, options)) {
    return;
  }

  writeEvent({
    kind,
    timestamp: new Date().toISOString(),
    channelId,
    messageId: reaction.message.id,
    payload: {
      emoji: reaction.emoji.toString(),
      user_id: user.id,
      count: reaction.count,
      burst: reaction.meBurst,
    },
  });
}

function isAllowed(
  guildId: string | undefined,
  channelId: string,
  options: RecorderStartOptions,
): boolean {
  const guildAllowed = !options.guildIds || options.guildIds.length === 0
    ? true
    : Boolean(guildId && options.guildIds.includes(guildId));

  const channelAllowed = !options.channelIds || options.channelIds.length === 0
    ? true
    : options.channelIds.includes(channelId);

  return guildAllowed && channelAllowed;
}
