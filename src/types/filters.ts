import type { TranscriptMessage } from "./transcript.js";

export interface FilterContextMaps {
  categoryByChannelId?: Record<string, string>;
  ticketByChannelId?: Record<string, string>;
}

export interface FilterGroup {
  op: "AND" | "OR";
  conditions: Array<FilterCondition | FilterGroup>;
}

export type FilterCondition =
  | { kind: "authorId"; in: string[] }
  | { kind: "username"; in: string[]; caseSensitive?: boolean }
  | { kind: "discriminator"; in: string[] }
  | { kind: "roleId"; in: string[] }
  | { kind: "authorType"; value: "bot" | "human" }
  | { kind: "betweenUsers"; users: [string, string] }
  | { kind: "date"; after?: string; before?: string }
  | { kind: "relativeTime"; lastDays?: number; lastHours?: number; lastMessages?: number }
  | { kind: "snowflake"; after?: string; before?: string }
  | {
      kind: "contentContains";
      terms: string[];
      mode: "any" | "all";
      caseSensitive?: boolean;
    }
  | { kind: "regex"; pattern: string; flags?: string }
  | {
      kind: "has";
      value:
        | "link"
        | "attachment"
        | "image"
        | "video"
        | "embed"
        | "reaction"
        | "emoji"
        | "mention"
        | "codeblock";
    }
  | { kind: "length"; min?: number; max?: number }
  | { kind: "messageType"; in: number[] }
  | {
      kind: "state";
      value:
        | "edited"
        | "deleted"
        | "pinned"
        | "thread"
        | "reply"
        | "slash"
        | "system"
        | "poll"
        | "components";
    }
  | {
      kind: "scope";
      channelIds?: string[];
      categoryIds?: string[];
      threadIds?: string[];
      ticketIds?: string[];
    };

export interface FilterContext {
  channelId: string;
  categoryByChannelId: Record<string, string>;
  ticketByChannelId: Record<string, string>;
  now: Date;
  indexFromEnd: number;
}

export type MessagePredicate = (
  message: TranscriptMessage,
  ctx: FilterContext,
) => boolean | Promise<boolean>;
