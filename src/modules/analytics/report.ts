import type { AnalyticsOptions, AnalyticsReport, TranscriptDocument } from "@/types.js";

const STOP_WORDS = new Set([
  "the",
  "and",
  "a",
  "an",
  "to",
  "of",
  "in",
  "on",
  "for",
  "is",
  "it",
  "that",
  "this",
  "with",
  "you",
  "i",
  "we",
  "they",
  "he",
  "she",
  "at",
  "be",
  "or",
  "as",
  "are",
  "was",
  "were",
  "from",
  "by",
  "if",
  "but",
  "not",
]);

export function generateAnalyticsReport(
  transcript: TranscriptDocument,
  options: AnalyticsOptions = {},
): AnalyticsReport {
  const messages = transcript.messages;
  const topWordsLimit = Math.max(5, options.topWordsLimit ?? 100);
  const topMentionedLimit = Math.max(3, options.topMentionedLimit ?? 25);
  const highlightCount = Math.max(3, options.highlightCount ?? 12);
  const responseWindowMinutes = Math.max(1, options.responseWindowMinutes ?? 240);

  const messageCountPerUserMap = new Map<string, { username: string; count: number }>();
  const attachmentByTypeMap = new Map<string, number>();
  const mentionMap = new Map<string, { username: string; count: number }>();
  const wordMap = new Map<string, number>();
  const activityByHour = new Array<number>(24).fill(0);
  const heatmapMap = new Map<string, number>();

  let totalAttachmentCount = 0;
  let totalAttachmentBytes = 0;
  let messagesWithReactions = 0;
  let totalReactionEntries = 0;

  for (const message of messages) {
    const authorId = message.author?.id ?? "unknown";
    const username = message.author?.globalName ?? message.author?.username ?? "Unknown";

    const userEntry = messageCountPerUserMap.get(authorId) ?? { username, count: 0 };
    userEntry.count += 1;
    messageCountPerUserMap.set(authorId, userEntry);

    if (message.reactions.length > 0) {
      messagesWithReactions += 1;
      totalReactionEntries += message.reactions.length;
    }

    for (const attachment of message.attachments) {
      totalAttachmentCount += 1;
      totalAttachmentBytes += attachment.size;
      const type = normalizeAttachmentType(attachment.contentType, attachment.filename);
      attachmentByTypeMap.set(type, (attachmentByTypeMap.get(type) ?? 0) + 1);
    }

    for (const mentionedUser of message.mentions.users) {
      const mentionEntry = mentionMap.get(mentionedUser.id) ?? {
        username: mentionedUser.globalName ?? mentionedUser.username,
        count: 0,
      };
      mentionEntry.count += 1;
      mentionMap.set(mentionedUser.id, mentionEntry);
    }

    for (const word of tokenize(message.content)) {
      if (STOP_WORDS.has(word)) {
        continue;
      }
      wordMap.set(word, (wordMap.get(word) ?? 0) + 1);
    }

    const createdAt = new Date(message.createdAt);
    if (!Number.isNaN(createdAt.getTime())) {
      const hour = createdAt.getUTCHours();
      activityByHour[hour] = (activityByHour[hour] ?? 0) + 1;

      if (options.includeHeatmap) {
        const day = createdAt.toISOString().slice(0, 10);
        const key = `${day}:${hour}`;
        heatmapMap.set(key, (heatmapMap.get(key) ?? 0) + 1);
      }
    }
  }

  const responseMetrics = computeResponseTimeMetrics(messages, responseWindowMinutes);
  const highlights = computeHighlights(messages, highlightCount);

  return {
    exportedAt: new Date().toISOString(),
    messageCountPerUser: mapToSortedList(messageCountPerUserMap).map((item) => ({
      userId: item.id,
      username: item.username,
      count: item.count,
    })),
    attachmentStats: {
      total: totalAttachmentCount,
      byContentType: sortMapDesc(attachmentByTypeMap).map(([contentType, count]) => ({
        contentType,
        count,
      })),
      totalBytes: totalAttachmentBytes,
    },
    reactionStats: {
      totalReactionEntries,
      messagesWithReactions,
    },
    wordFrequency: sortMapDesc(wordMap)
      .slice(0, topWordsLimit)
      .map(([word, count]) => ({ word, count })),
    activityTimelineByHour: activityByHour.map((count, hour) => ({ hour, count })),
    peakActivityHours: activityByHour
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3),
    topMentionedUsers: mapToSortedList(mentionMap)
      .slice(0, topMentionedLimit)
      .map((item) => ({
        userId: item.id,
        username: item.username,
        count: item.count,
      })),
    responseTimeMetrics: responseMetrics,
    conversationHeatmap: options.includeHeatmap
      ? [...heatmapMap.entries()]
          .map(([key, count]) => {
            const [day, hourRaw] = key.split(":");
            return {
              day: day ?? "unknown-day",
              hour: Number(hourRaw),
              count,
            };
          })
          .sort((a, b) => (a.day === b.day ? a.hour - b.hour : a.day.localeCompare(b.day)))
      : undefined,
    highlights,
  };
}

function tokenize(content: string): string[] {
  return content
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .split(/[^\p{L}\p{N}_]+/u)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && token.length <= 40);
}

function normalizeAttachmentType(contentType: string | undefined, filename: string): string {
  if (contentType && contentType.trim().length > 0) {
    return contentType;
  }

  const extension = filename.includes(".") ? filename.split(".").pop() : undefined;
  return extension ? `file/${extension.toLowerCase()}` : "unknown";
}

function mapToSortedList(
  map: Map<string, { username: string; count: number }>,
): Array<{ id: string; username: string; count: number }> {
  return [...map.entries()]
    .map(([id, value]) => ({ id, username: value.username, count: value.count }))
    .sort((a, b) => b.count - a.count);
}

function sortMapDesc(map: Map<string, number>): Array<[string, number]> {
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function computeResponseTimeMetrics(
  messages: TranscriptDocument["messages"],
  responseWindowMinutes: number,
): AnalyticsReport["responseTimeMetrics"] {
  const sorted = [...messages].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return aTime - bTime;
  });

  const samples: number[] = [];
  const maxDeltaSeconds = responseWindowMinutes * 60;

  for (let i = 1; i < sorted.length; i += 1) {
    const previous = sorted[i - 1];
    const current = sorted[i];
    if (!previous || !current) {
      continue;
    }

    const previousAuthor = previous.author?.id;
    const currentAuthor = current.author?.id;

    if (!previousAuthor || !currentAuthor || previousAuthor === currentAuthor) {
      continue;
    }

    const deltaSeconds =
      (new Date(current.createdAt).getTime() - new Date(previous.createdAt).getTime()) / 1000;

    if (deltaSeconds >= 0 && deltaSeconds <= maxDeltaSeconds) {
      samples.push(deltaSeconds);
    }
  }

  if (samples.length === 0) {
    return {
      sampledTransitions: 0,
      averageSeconds: 0,
      medianSeconds: 0,
      p95Seconds: 0,
    };
  }

  samples.sort((a, b) => a - b);

  const averageSeconds = samples.reduce((sum, item) => sum + item, 0) / samples.length;
  const medianSeconds = quantile(samples, 0.5);
  const p95Seconds = quantile(samples, 0.95);

  return {
    sampledTransitions: samples.length,
    averageSeconds: round2(averageSeconds),
    medianSeconds: round2(medianSeconds),
    p95Seconds: round2(p95Seconds),
  };
}

function quantile(sortedValues: number[], q: number): number {
  if (sortedValues.length === 0) {
    return 0;
  }

  const pos = (sortedValues.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const next = sortedValues[base + 1];

  if (next === undefined) {
    return sortedValues[base] ?? 0;
  }

  const baseValue = sortedValues[base] ?? 0;
  return baseValue + rest * (next - baseValue);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function computeHighlights(
  messages: TranscriptDocument["messages"],
  highlightCount: number,
): Array<{ messageId: string; reason: string }> {
  const candidates = messages
    .map((message) => {
      const contentLengthScore = Math.min(message.content.length / 120, 5);
      const reactionScore = message.reactions.length * 1.2;
      const attachmentScore = message.attachments.length * 0.8;
      const mentionScore = message.mentions.users.length * 0.4;
      const score = contentLengthScore + reactionScore + attachmentScore + mentionScore;

      return {
        messageId: message.id,
        score,
        reason: buildHighlightReason(message),
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, highlightCount);

  return candidates.map((item) => ({
    messageId: item.messageId,
    reason: item.reason,
  }));
}

function buildHighlightReason(message: TranscriptDocument["messages"][number]): string {
  if (message.reactions.length > 0) {
    return "High reaction activity";
  }
  if (message.attachments.length > 0) {
    return "Contains important attachment(s)";
  }
  if (message.content.length >= 280) {
    return "Long-form message";
  }
  if (message.mentions.users.length > 0) {
    return "Mentions participants";
  }
  return "Notable message";
}
