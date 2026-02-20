import { describe, expect, it } from "vitest";
import { HeuristicAIProvider } from "../src/modules/ai/providers.js";
import type { TranscriptDocument } from "../src/types.ts";

describe("heuristic ai provider", () => {
  it("returns deterministic summary and highlights", async () => {
    const provider = new HeuristicAIProvider();

    const transcript: TranscriptDocument = {
      version: "1",
      exportedAt: "2026-02-19T10:00:00.000Z",
      exporter: { name: "test", version: "1" },
      meta: {
        sourceChannelIds: ["c1"],
        intentsSatisfied: { messageContent: true },
        formats: ["json-full"],
        timezone: "UTC",
        timestampFormat: "24h",
        renderTheme: "discord-dark-like",
        readOnly: false,
        watermarked: false,
      },
      channel: { id: "c1", name: "ticket-1" },
      threads: [],
      participants: [{ id: "u1", username: "alice" }],
      messages: [
        {
          id: "1",
          channelId: "c1",
          type: 0,
          createdAt: "2026-02-19T10:00:00.000Z",
          editedAt: null,
          pinned: false,
          content: "Issue started when gateway timed out",
          author: { id: "u1", username: "alice" },
          mentions: { everyone: false, users: [], roles: [], channels: [] },
          attachments: [],
          embeds: [],
          reactions: [],
          components: [],
          stickerItems: [],
          raw: {},
        },
      ],
      attachmentsManifest: [],
      limitations: [],
      warnings: [],
    };

    const result = await provider.summarize({
      transcript,
      report: {
        exportedAt: "2026-02-19T10:01:00.000Z",
        messageCountPerUser: [{ userId: "u1", username: "alice", count: 1 }],
        attachmentStats: { total: 0, byContentType: [], totalBytes: 0 },
        reactionStats: { totalReactionEntries: 0, messagesWithReactions: 0 },
        wordFrequency: [{ word: "gateway", count: 1 }],
        activityTimelineByHour: [{ hour: 10, count: 1 }],
        peakActivityHours: [{ hour: 10, count: 1 }],
        topMentionedUsers: [],
        responseTimeMetrics: {
          sampledTransitions: 0,
          averageSeconds: 0,
          medianSeconds: 0,
          p95Seconds: 0,
        },
        highlights: [{ messageId: "1", reason: "Notable message" }],
      },
      options: {
        enabled: true,
        maxHighlights: 3,
      },
    });

    expect(result.providerId).toBe("heuristic");
    expect(result.summary).toContain("Conversation exported");
    expect(result.highlights.length).toBeGreaterThan(0);
  });
});
