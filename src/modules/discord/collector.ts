/**
 * Collects channel, threads, messages, and optionally guild + channels from Discord via the API client.
 */
import type { DiscordApiClient } from "@/modules/discord/discord-api.js";
import type { ExportRequest } from "@/types.js";
import type { RawChannel, RawGuild, RawMessage } from "@/modules/discord/discord-api.js";

export interface CollectedData {
  channel: RawChannel;
  threads: RawChannel[];
  messages: RawMessage[];
  guild?: RawGuild;
  guildChannels?: RawChannel[];
  limitations: string[];
}

export async function collectMessages(options: {
  api: DiscordApiClient;
  request: ExportRequest;
  warnings: string[];
}): Promise<CollectedData> {
  const { api, request, warnings } = options;
  const limitations: string[] = [];

  const channel = await api.getChannel(request.channelId);
  const threads: RawChannel[] = [];
  const messages: RawMessage[] = [];

  const guildId = channel.guild_id ?? request.guildId;
  let guild: RawGuild | undefined;
  let guildChannels: RawChannel[] | undefined;
  if (guildId) {
    try {
      guild = await api.getGuild(guildId);
      guildChannels = await api.getGuildChannels(guildId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      warnings.push(`Could not fetch guild/channels for full UI: ${msg}`);
    }
  }

  const mainMessages = await api.getAllChannelMessages(request.channelId);
  messages.push(...mainMessages);

  const threadIds = request.threadIds ?? [];
  for (const threadId of threadIds) {
    try {
      const thread = await api.getChannel(threadId);
      threads.push(thread);
      const threadMessages = await api.getAllChannelMessages(threadId);
      messages.push(...threadMessages);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      warnings.push(`Failed to fetch thread ${threadId}: ${msg}`);
    }
  }

  return {
    channel,
    threads,
    messages,
    guild,
    guildChannels,
    limitations,
  };
}
