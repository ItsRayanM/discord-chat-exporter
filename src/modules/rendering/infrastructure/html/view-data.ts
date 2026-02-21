import MarkdownIt from "markdown-it";
import type { RenderContext, TranscriptMessage } from "@/types.js";
import { escapeHtml } from "@/modules/rendering/infrastructure/html/escape-html.js";
import type {
  HtmlMessageView,
  HtmlViewData,
  HtmlGuildView,
  HtmlChannelView,
  HtmlMemberView,
  SearchIndexData,
  TocEntry,
} from "@/modules/rendering/infrastructure/html/types.js";

export function buildViewData(ctx: RenderContext): HtmlViewData {
  const md = new MarkdownIt({
    html: true,
    breaks: true,
    linkify: true,
    highlight(code, lang) {
      const safeCode = escapeHtml(code);
      const languageClass = lang ? ` class="language-${escapeHtml(lang)}"` : "";
      return `<pre><code${languageClass}>${safeCode}</code></pre>`;
    },
  });

  const messages: HtmlMessageView[] = ctx.transcript.messages.map((message) => {
    const createdAt = new Date(message.createdAt);
    const dayKey = Number.isNaN(createdAt.getTime()) ? "unknown-day" : createdAt.toISOString().slice(0, 10);

    return {
      id: message.id,
      author: message.author?.globalName ?? message.author?.username ?? "Unknown",
      authorId: message.author?.id ?? "",
      avatarUrl: message.author?.avatarUrl,
      createdAt: message.createdAt,
      dayKey,
      editedAt: message.editedAt,
      contentHtml: renderDiscordMarkdown(message, md),
      contentText: message.content,
      attachments: message.attachments.map((attachment) => ({
        filename: attachment.filename,
        url: attachment.url,
        localPath: attachment.localPath,
        dataUrl: attachment.dataUrl,
        contentType: attachment.contentType,
      })),
      embeds: message.embeds,
      reactions: message.reactions,
      channelId: message.channelId,
      type: message.type,
      pinned: message.pinned,
      deleted: Boolean(message.deleted),
    };
  });

  const guild: HtmlGuildView | undefined = ctx.transcript.guild
    ? {
        id: ctx.transcript.guild.id,
        name: ctx.transcript.guild.name,
        iconUrl: ctx.transcript.guild.iconUrl,
      }
    : undefined;

  const channel: HtmlChannelView | undefined = {
    id: ctx.transcript.channel.id,
    name: ctx.transcript.channel.name,
    type: ctx.transcript.channel.type,
    parentId: ctx.transcript.channel.parentId,
  };

  const channels: HtmlChannelView[] | undefined = ctx.transcript.guildChannels?.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    parentId: c.parentId,
  }));

  const members: HtmlMemberView[] | undefined = ctx.transcript.participants.map((p) => ({
    id: p.id,
    username: p.username,
    globalName: p.globalName,
    avatarUrl: p.avatarUrl,
    bot: p.bot,
  }));

  const panelsConfig = ctx.request.render?.html?.panels;
  const panels = {
    serverList: panelsConfig?.serverList !== false,
    channelList: panelsConfig?.channelList !== false,
    membersSidebar: panelsConfig?.membersSidebar !== false,
  };

  return {
    title: `Transcript: ${ctx.transcript.channel.name ?? ctx.transcript.channel.id}`,
    exportedAt: ctx.transcript.exportedAt,
    messages,
    warnings: ctx.transcript.warnings,
    limitations: ctx.transcript.limitations,
    watermark: ctx.request.render?.watermark,
    readOnly: ctx.request.render?.readOnly ?? false,
    searchable: ctx.request.render?.html?.searchable ?? true,
    accessibilityMode: ctx.request.render?.html?.accessibilityMode ?? false,
    toc: buildToc(messages, ctx.request.render?.includeTableOfContents ?? false),
    chunk: ctx.transcript.meta.chunk,
    guild,
    channel,
    channels,
    members,
    panels,
  };
}

function buildToc(messages: HtmlMessageView[], enabled: boolean): TocEntry[] {
  if (!enabled) {
    return [];
  }

  const counts = new Map<string, number>();
  for (const message of messages) {
    counts.set(message.dayKey, (counts.get(message.dayKey) ?? 0) + 1);
  }

  return [...counts.entries()].map(([day, count]) => ({
    id: `day-${day}`,
    day,
    count,
  }));
}

export function buildSearchIndex(messages: HtmlMessageView[]): SearchIndexData {
  const tokenMap = new Map<string, Set<number>>();

  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];
    if (!message) {
      continue;
    }
    const tokens = tokenizeForIndex(`${message.author} ${message.authorId} ${message.contentText} ${message.id}`);
    for (const token of tokens) {
      if (!tokenMap.has(token)) {
        tokenMap.set(token, new Set<number>());
      }
      tokenMap.get(token)?.add(index);
    }
  }

  const serialized: Record<string, number[]> = {};
  for (const [token, set] of tokenMap.entries()) {
    serialized[token] = [...set];
  }

  return {
    tokenMap: serialized,
  };
}

function tokenizeForIndex(input: string): string[] {
  const matches = input.toLowerCase().match(/[a-z0-9_@#.:/\\-]+/g) ?? [];
  return [...new Set(matches.filter((token) => token.length >= 2))];
}

function renderDiscordMarkdown(message: TranscriptMessage, md: MarkdownIt): string {
  let content = message.content;

  content = content.replace(/<@!?(\d+)>/g, (_, id: string) => {
    const user = message.mentions.users.find((item) => item.id === id);
    const name = user?.globalName ?? user?.username ?? id;
    return `<span class="discord-mention">@${escapeHtml(name)}</span>`;
  });

  content = content.replace(/<@&(\d+)>/g, (_, id: string) => {
    return `<span class="discord-mention">@role:${escapeHtml(id)}</span>`;
  });

  content = content.replace(/<#(\d+)>/g, (_, id: string) => {
    return `<span class="discord-channel-mention">#${escapeHtml(id)}</span>`;
  });

  content = content.replace(/<t:(\d+)(?::[tTdDfFR])?>/g, (_, unix: string) => {
    const date = new Date(Number(unix) * 1000);
    if (Number.isNaN(date.getTime())) {
      return `<span class="discord-inline-time">&lt;t:${escapeHtml(unix)}&gt;</span>`;
    }

    return `<time class="discord-inline-time" datetime="${date.toISOString()}">${date.toLocaleString()}</time>`;
  });

  content = content.replace(/<(a?):([a-zA-Z0-9_]+):(\d+)>/g, (_, animated: string, name: string, id: string) => {
    const ext = animated ? "gif" : "png";
    const url = `https://cdn.discordapp.com/emojis/${id}.${ext}?quality=lossless`;
    return `<img src="${url}" alt=":${escapeHtml(name)}:" class="emoji emoji-custom">`;
  });

  content = content.replace(/\|\|([^|]+)\|\|/g, (_, value: string) => {
    return `<span class="discord-spoiler">${escapeHtml(value)}</span>`;
  });

  content = content.replace(/(^|\s)@everyone(\s|$)/g, "$1<span class=\"discord-mention\">@everyone</span>$2");
  content = content.replace(/(^|\s)@here(\s|$)/g, "$1<span class=\"discord-mention\">@here</span>$2");

  return md.render(content);
}
