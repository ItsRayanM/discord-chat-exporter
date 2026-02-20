import { describe, expect, it } from "vitest";
import { applyFilters, evaluateFilterGroup } from "../src/modules/transcript/index.js";
import type { ExportRequest, TranscriptMessage } from "../src/types.ts";

describe("filter-engine", () => {
  it("supports nested AND/OR groups", async () => {
    const messages: TranscriptMessage[] = [
      buildMessage({ id: "1", authorId: "a", content: "hello world" }),
      buildMessage({ id: "2", authorId: "b", content: "ticket closed" }),
      buildMessage({ id: "3", authorId: "a", content: "urgent ticket" }),
    ];

    const request: ExportRequest = {
      token: "x",
      channelId: "c1",
      formats: ["json-full"],
      output: { dir: "./tmp" },
      filters: {
        op: "AND",
        conditions: [
          { kind: "authorId", in: ["a"] },
          {
            op: "OR",
            conditions: [
              { kind: "contentContains", terms: ["hello"], mode: "any" },
              { kind: "regex", pattern: "urgent", flags: "i" },
            ],
          },
        ],
      },
    };

    const result = await applyFilters({ messages, request });
    expect(result.map((item) => item.id)).toEqual(["1", "3"]);
  });
});

function buildMessage(input: {
  id: string;
  authorId: string;
  content: string;
}): TranscriptMessage {
  return {
    id: input.id,
    channelId: "c1",
    guildId: "g1",
    type: 0,
    createdAt: new Date().toISOString(),
    editedAt: null,
    pinned: false,
    content: input.content,
    author: {
      id: input.authorId,
      username: `user-${input.authorId}`,
    },
    mentions: {
      everyone: false,
      users: [],
      roles: [],
      channels: [],
    },
    attachments: [],
    embeds: [],
    reactions: [],
    components: [],
    stickerItems: [],
    raw: {},
  };
}
