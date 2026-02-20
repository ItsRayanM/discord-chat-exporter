/**
 * Collects channel, threads, and messages from Discord via the API client.
 */
import type { DiscordApiClient } from "@/modules/discord/discord-api.js";
import type { ExportRequest } from "@/types.js";
import type { RawChannel, RawMessage } from "@/modules/discord/discord-api.js";

export interface CollectedData {
  channel: RawChannel;
  threads: RawChannel[];
  messages: RawMessage[];
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
    limitations,
  };
}
