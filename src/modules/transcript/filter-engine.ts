/**
 * Filter engine: evaluate filter groups and apply filters to message lists.
 */
import type {
  ExportRequest,
  TranscriptMessage,
  FilterGroup,
  FilterCondition,
  FilterContext,
  FilterContextMaps,
  MessagePredicate,
} from "@/types.js";
import { compareSnowflakes } from "@/shared/utils/snowflake.js";

function parseDate(s: string | undefined): number | undefined {
  if (!s) return undefined;
  const t = Date.parse(s);
  return Number.isNaN(t) ? undefined : t;
}

function evaluateCondition(msg: TranscriptMessage, cond: FilterCondition, ctx: FilterContext): boolean {
  switch (cond.kind) {
    case "authorId":
      return msg.author ? cond.in.includes(msg.author.id) : false;
    case "username":
      if (!msg.author) return false;
      const un = msg.author.username ?? "";
      return cond.in.some((x) => (cond.caseSensitive ? un === x : un.toLowerCase() === x.toLowerCase()));
    case "contentContains": {
      const content = msg.content ?? "";
      const text = cond.caseSensitive ? content : content.toLowerCase();
      const terms = cond.caseSensitive ? cond.terms : cond.terms.map((t) => t.toLowerCase());
      if (cond.mode === "any") return terms.some((t) => text.includes(t));
      return terms.every((t) => text.includes(t));
    }
    case "regex": {
      const re = new RegExp(cond.pattern, cond.flags ?? "");
      return re.test(msg.content ?? "");
    }
    case "date": {
      const ts = parseDate(msg.createdAt);
      if (ts == null) return false;
      const after = parseDate(cond.after);
      const before = parseDate(cond.before);
      if (after != null && ts < after) return false;
      if (before != null && ts > before) return false;
      return true;
    }
    case "snowflake": {
      const id = msg.id;
      if (cond.after && compareSnowflakes(id, cond.after) <= 0) return false;
      if (cond.before && compareSnowflakes(id, cond.before) >= 0) return false;
      return true;
    }
    case "messageType":
      return cond.in.includes(msg.type);
    case "state":
      switch (cond.value) {
        case "edited":
          return Boolean(msg.editedAt);
        case "pinned":
          return msg.pinned;
        case "reply":
          return Boolean(msg.messageReference?.messageId);
        default:
          return false;
      }
    case "has":
      switch (cond.value) {
        case "attachment":
          return (msg.attachments?.length ?? 0) > 0;
        case "embed":
          return (msg.embeds?.length ?? 0) > 0;
        case "reaction":
          return (msg.reactions?.length ?? 0) > 0;
        case "mention":
          return (msg.mentions?.users?.length ?? 0) > 0 || msg.mentions?.everyone;
        case "link":
          return /https?:\/\//.test(msg.content ?? "");
        default:
          return false;
      }
    case "length": {
      const len = (msg.content ?? "").length;
      if (cond.min != null && len < cond.min) return false;
      if (cond.max != null && len > cond.max) return false;
      return true;
    }
    default:
      return false;
  }
}

export function evaluateFilterGroup(
  message: TranscriptMessage,
  group: FilterGroup,
  ctx: FilterContext,
): boolean {
  const results = group.conditions.map((c) => {
    if ("op" in c && (c.op === "AND" || c.op === "OR")) {
      return evaluateFilterGroup(message, c as FilterGroup, ctx);
    }
    return evaluateCondition(message, c as FilterCondition, ctx);
  });
  if (group.op === "AND") return results.every(Boolean);
  return results.some(Boolean);
}

export async function applyFilters(options: {
  messages: TranscriptMessage[];
  request: ExportRequest;
}): Promise<TranscriptMessage[]> {
  const { messages, request } = options;
  const filters = request.filters;
  const predicate = request.predicate;
  const contextMaps: FilterContextMaps = request.filterContext ?? {};
  const categoryByChannelId = contextMaps.categoryByChannelId ?? {};
  const ticketByChannelId = contextMaps.ticketByChannelId ?? {};
  const now = new Date();

  const out: TranscriptMessage[] = [];
  for (let i = 0; i < messages.length; i += 1) {
    const msg = messages[i];
    if (!msg) continue;
    const ctx: FilterContext = {
      channelId: msg.channelId,
      categoryByChannelId,
      ticketByChannelId,
      now,
      indexFromEnd: messages.length - 1 - i,
    };
    if (filters && !evaluateFilterGroup(msg, filters, ctx)) continue;
    if (predicate) {
      const ok = await predicate(msg, ctx);
      if (!ok) continue;
    }
    out.push(msg);
  }
  return out;
}
