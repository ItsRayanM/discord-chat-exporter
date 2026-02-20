import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { persistExportToDatabase } from "../src/modules/delivery/database-delivery.js";
import type { ExportRequest, TranscriptDocument } from "../src/types.ts";

describe("database delivery", () => {
  it("uses a custom adapter for non built-in drivers", async () => {
    const request: ExportRequest = {
      token: "token",
      channelId: "c1",
      formats: ["json-full"],
      output: {
        dir: "./tmp",
        database: {
          enabled: true,
          driver: "custom-driver",
        },
      },
    };

    const transcript: TranscriptDocument = {
      version: "1",
      exportedAt: "2026-02-19T00:00:00.000Z",
      exporter: { name: "test", version: "1.0.0" },
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
      participants: [],
      messages: [],
      attachmentsManifest: [],
      limitations: [],
      warnings: [],
    };

    const persist = vi.fn().mockResolvedValue({
      driver: "custom-driver",
      exportId: "abc123",
      location: "custom.storage",
    });

    const result = await persistExportToDatabase({
      database: request.output.database!,
      request,
      transcript,
      artifacts: [],
      stats: {
        scannedMessages: 1,
        exportedMessages: 1,
        skippedMessages: 0,
        durationMs: 100,
        attachmentsProcessed: 0,
        attachmentsFailed: 0,
        channelsProcessed: 1,
      },
      adapters: new Map([
        [
          "custom-driver",
          {
            id: "custom-driver",
            persist,
          },
        ],
      ]),
    });

    expect(persist).toHaveBeenCalledOnce();
    expect(result).toEqual({
      driver: "custom-driver",
      exportId: "abc123",
      location: "custom.storage",
    });
  });

  it("persists export data to sqlite when better-sqlite3 is available", async () => {
    let DatabaseCtor: typeof import("better-sqlite3") | undefined;

    try {
      DatabaseCtor = (await import("better-sqlite3")).default as typeof import("better-sqlite3");
    } catch {
      return;
    }

    try {
      const probe = new DatabaseCtor(":memory:");
      probe.close();
    } catch {
      return;
    }

    const tempDir = await mkdtemp(join(tmpdir(), "dcexport-db-delivery-test-"));
    const sqlitePath = join(tempDir, "exports.sqlite");

    try {
      const request: ExportRequest = {
        token: "token",
        channelId: "c1",
        formats: ["json-full"],
        output: {
          dir: tempDir,
          database: {
            enabled: true,
            driver: "sqlite",
            sqlitePath,
            table: "exports_log",
          },
        },
      };

      const transcript: TranscriptDocument = {
        version: "1",
        exportedAt: "2026-02-19T00:00:00.000Z",
        exporter: { name: "test", version: "1.0.0" },
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
        participants: [],
        messages: [],
        attachmentsManifest: [],
        limitations: [],
        warnings: [],
      };

      const result = await persistExportToDatabase({
        database: request.output.database!,
        request,
        transcript,
        artifacts: [],
        stats: {
          scannedMessages: 1,
          exportedMessages: 1,
          skippedMessages: 0,
          durationMs: 100,
          attachmentsProcessed: 0,
          attachmentsFailed: 0,
          channelsProcessed: 1,
        },
      });

      expect(result.driver).toBe("sqlite");
      expect(result.location).toBe(sqlitePath);
      expect(result.exportId).toBeGreaterThan(0);

      const db = new DatabaseCtor(sqlitePath);
      try {
        const row = db
          .prepare("SELECT COUNT(1) as count, channel_id as channelId FROM exports_log WHERE id = ?")
          .get(result.exportId) as { count: number; channelId: string };

        expect(row.count).toBe(1);
        expect(row.channelId).toBe("c1");
      } finally {
        db.close();
      }
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
