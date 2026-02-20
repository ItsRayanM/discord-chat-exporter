import { describe, expect, it } from "vitest";
import { generateAnalyticsReport } from "../src/modules/analytics/report.js";
import type { TranscriptDocument } from "../src/types.ts";

describe("analytics report", () => {
  it("computes core metrics and highlights", () => {
    const transcript: TranscriptDocument = {
      version: "1",
      exportedAt: new Date().toISOString(),
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
      participants: [
        { id: "u1", username: "alice" },
        { id: "u2", username: "bob" },
      ],
      messages: [
        {
          id: "100",
          channelId: "c1",
          type: 0,
          createdAt: "2026-02-19T10:00:00.000Z",
          editedAt: null,
          pinned: false,
          content: "hello urgent payment issue",
          author: { id: "u1", username: "alice" },
          mentions: {
            everyone: false,
            users: [{ id: "u2", username: "bob" }],
            roles: [],
            channels: [],
          },
          attachments: [
            {
              id: "a1",
              filename: "invoice.pdf",
              url: "https://cdn.example/invoice.pdf",
              size: 1200,
              contentType: "application/pdf",
              spoiler: false,
            },
          ],
          embeds: [],
          reactions: [{ emoji: "👍", count: 2 }],
          components: [],
          stickerItems: [],
          raw: {},
        },
        {
          id: "101",
          channelId: "c1",
          type: 0,
          createdAt: "2026-02-19T10:02:00.000Z",
          editedAt: null,
          pinned: false,
          content: "working on it now",
          author: { id: "u2", username: "bob" },
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
        },
      ],
      attachmentsManifest: [],
      limitations: [],
      warnings: [],
    };

    const report = generateAnalyticsReport(transcript, {
      enabled: true,
      includeHeatmap: true,
      topWordsLimit: 10,
      topMentionedLimit: 10,
      highlightCount: 5,
    });

    expect(report.messageCountPerUser[0]).toMatchObject({ userId: "u1", count: 1 });
    expect(report.attachmentStats.total).toBe(1);
    expect(report.reactionStats.totalReactionEntries).toBe(1);
    expect(report.wordFrequency.some((entry) => entry.word === "urgent")).toBe(true);
    expect(report.responseTimeMetrics.sampledTransitions).toBe(1);
    expect(report.conversationHeatmap?.length).toBeGreaterThan(0);
    expect(report.highlights.length).toBeGreaterThan(0);
  });
});
