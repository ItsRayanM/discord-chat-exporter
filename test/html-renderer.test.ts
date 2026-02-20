import { describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { renderHtmlSingle } from "../src/modules/rendering/html.js";
import type { RenderContext, TranscriptDocument } from "../src/types.ts";

describe("html renderer", () => {
  it("renders mentions, timestamps, and emoji placeholders", async () => {
    const outDir = await mkdtemp(join(tmpdir(), "dcexport-html-test-"));

    try {
      const transcript: TranscriptDocument = {
        version: "1",
        exportedAt: new Date().toISOString(),
        exporter: { name: "test", version: "1" },
        meta: {
          sourceChannelIds: ["1"],
          intentsSatisfied: { messageContent: true },
          formats: ["html-single"],
          timezone: "UTC",
          timestampFormat: "24h",
          renderTheme: "discord-dark-like",
          readOnly: false,
          watermarked: false,
        },
        channel: { id: "1", name: "ticket-1" },
        threads: [],
        participants: [
          { id: "100", username: "alpha" },
          { id: "200", username: "beta" },
        ],
        messages: [
          {
            id: "10",
            channelId: "1",
            type: 0,
            createdAt: new Date().toISOString(),
            editedAt: null,
            pinned: false,
            content: "Hello <@200> <t:1700000000:F> <:smile:123456789012345678>",
            author: { id: "100", username: "alpha" },
            mentions: {
              everyone: false,
              users: [{ id: "200", username: "beta" }],
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

      const ctx: RenderContext = {
        transcript,
        request: {
          token: "x",
          channelId: "1",
          formats: ["html-single"],
          output: { dir: outDir },
        },
        outputBaseName: "sample",
        outputDir: outDir,
      };

      const artifacts = await renderHtmlSingle(ctx);
      const html = await readFile(artifacts[0].path, "utf8");

      expect(html).toContain("@beta");
      expect(html).toContain("emoji");
      expect(html).toContain("Search by content");
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it("uses custom html template file when provided", async () => {
    const outDir = await mkdtemp(join(tmpdir(), "dcexport-html-template-test-"));

    try {
      const templatePath = join(outDir, "template.html");
      await writeFile(
        templatePath,
        `<!doctype html>
<html lang="en" dir="{{dir}}">
<head>
  <meta charset="utf-8">
  <title>{{title}}</title>
  {{styles_inline}}
</head>
<body class="custom-template-shell">
  {{app_root}}
  {{transcript_data_json}}
  {{app_script_inline}}
</body>
</html>`,
        "utf8",
      );

      const transcript: TranscriptDocument = {
        version: "1",
        exportedAt: new Date().toISOString(),
        exporter: { name: "test", version: "1" },
        meta: {
          sourceChannelIds: ["1"],
          intentsSatisfied: { messageContent: true },
          formats: ["html-single"],
          timezone: "UTC",
          timestampFormat: "24h",
          renderTheme: "discord-dark-like",
          readOnly: false,
          watermarked: false,
        },
        channel: { id: "1", name: "ticket-template" },
        threads: [],
        participants: [{ id: "100", username: "alpha" }],
        messages: [
          {
            id: "10",
            channelId: "1",
            type: 0,
            createdAt: new Date().toISOString(),
            editedAt: null,
            pinned: false,
            content: "Hello template",
            author: { id: "100", username: "alpha" },
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

      const ctx: RenderContext = {
        transcript,
        request: {
          token: "x",
          channelId: "1",
          formats: ["html-single"],
          render: {
            html: {
              templatePath,
            },
          },
          output: { dir: outDir },
        },
        outputBaseName: "sample-template",
        outputDir: outDir,
      };

      const artifacts = await renderHtmlSingle(ctx);
      const html = await readFile(artifacts[0].path, "utf8");

      expect(html).toContain("custom-template-shell");
      expect(html).toContain("ticket-template");
      expect(html).toContain("id=\"transcript-data\"");
      expect(html).toContain("id=\"app\"");
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });
});
