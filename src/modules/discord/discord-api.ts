/**
 * Minimal Discord REST API client for channel and message fetching.
 */

const API_BASE = "https://discord.com/api/v10";

export interface DiscordApiClientConfig {
  token: string;
  userAgent?: string;
}

export interface DiscordRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: string;
  headers?: Record<string, string>;
}

export interface DiscordMessageQuery {
  limit?: number;
  before?: string;
  after?: string;
  around?: string;
}

/** Raw Discord API channel object (subset we use). */
export interface RawChannel {
  id: string;
  name?: string;
  type?: number;
  guild_id?: string;
  parent_id?: string | null;
  owner_id?: string | null;
  archived?: boolean;
  thread_metadata?: { create_timestamp?: string };
}

/** Raw Discord API guild object (subset we use). */
export interface RawGuild {
  id: string;
  name?: string;
  icon?: string | null;
}

/** Raw Discord API message object (subset we use). */
export interface RawMessage {
  id: string;
  channel_id: string;
  guild_id?: string;
  type: number;
  content: string;
  timestamp: string;
  edited_timestamp?: string | null;
  pinned: boolean;
  flags?: number;
  author?: { id: string; username: string; global_name?: string; discriminator?: string; avatar?: string; bot?: boolean };
  mentions?: Array<{ id: string; username: string }>;
  mention_everyone?: boolean;
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
    proxy_url?: string;
    content_type?: string;
    size: number;
    width?: number | null;
    height?: number | null;
    duration_secs?: number;
    description?: string;
  }>;
  embeds?: unknown[];
  reactions?: unknown[];
  components?: unknown[];
  sticker_items?: unknown[];
  message_reference?: { message_id?: string; channel_id?: string; guild_id?: string };
  thread?: RawChannel;
  [key: string]: unknown;
}

export class DiscordApiClient {
  private readonly token: string;
  private readonly userAgent: string;

  constructor(config: DiscordApiClientConfig) {
    this.token = config.token;
    this.userAgent = config.userAgent ?? `DiscordChatExporter/1.0`;
  }

  private async request<T>(path: string, options: DiscordRequestOptions = {}): Promise<T> {
    const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bot ${this.token}`,
      "User-Agent": this.userAgent,
      ...options.headers,
    };
    if (options.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    const res = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body: options.body,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Discord API ${res.status}: ${text}`);
    }
    if (res.status === 204 || res.headers.get("Content-Length") === "0") {
      return undefined as T;
    }
    return (await res.json()) as T;
  }

  async getChannel(channelId: string): Promise<RawChannel> {
    return this.request<RawChannel>(`/channels/${channelId}`);
  }

  async getChannelMessages(
    channelId: string,
    query: DiscordMessageQuery = {},
  ): Promise<RawMessage[]> {
    const limit = Math.min(100, Math.max(1, query.limit ?? 100));
    const params = new URLSearchParams({ limit: String(limit) });
    if (query.before) params.set("before", query.before);
    if (query.after) params.set("after", query.after);
    if (query.around) params.set("around", query.around);
    const path = `/channels/${channelId}/messages?${params.toString()}`;
    return this.request<RawMessage[]>(path);
  }

  /** Fetch all messages in a channel (paginated). */
  async getAllChannelMessages(channelId: string, maxMessages?: number): Promise<RawMessage[]> {
    const out: RawMessage[] = [];
    const limit = 100;
    let before: string | undefined;
    const cap = maxMessages ?? 1_000_000;
    while (out.length < cap) {
      const batch = await this.getChannelMessages(channelId, {
        limit,
        before,
      });
      if (batch.length === 0) break;
      for (const m of batch) {
        if (out.length >= cap) break;
        out.push(m);
      }
      if (batch.length < limit) break;
      before = batch[batch.length - 1]?.id;
      if (!before) break;
    }
    return out;
  }

  /** Fetch guild by id (for full Discord UI). */
  async getGuild(guildId: string): Promise<RawGuild> {
    return this.request<RawGuild>(`/guilds/${guildId}?with_counts=false`);
  }

  /** Fetch guild channels (for full Discord UI). */
  async getGuildChannels(guildId: string): Promise<RawChannel[]> {
    return this.request<RawChannel[]>(`/guilds/${guildId}/channels`);
  }
}
