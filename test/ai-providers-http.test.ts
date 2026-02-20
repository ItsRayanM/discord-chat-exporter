import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AnthropicClaudeProvider,
  GoogleGeminiProvider,
  OpenAIProvider,
} from "../src/modules/ai/providers.js";
import type { AIProviderContext, TranscriptDocument } from "../src/types.ts";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ai http providers", () => {
  it("parses Gemini JSON response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      summary: "Gemini summary",
                      highlights: ["h1", "h2"],
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    const provider = new GoogleGeminiProvider({ apiKey: "test-key", model: "gemini-1.5-pro" });
    const result = await provider.summarize(buildContext());

    expect(result.providerId).toBe("gemini");
    expect(result.summary).toBe("Gemini summary");
    expect(result.highlights).toEqual(["h1", "h2"]);
  });

  it("parses Anthropic fenced JSON response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          content: [
            {
              type: "text",
              text: "```json\\n{\"summary\":\"Claude summary\",\"highlights\":[\"a\",\"b\"]}\\n```",
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    const provider = new AnthropicClaudeProvider({ apiKey: "anthropic-key" });
    const result = await provider.summarize(buildContext());

    expect(result.providerId).toBe("anthropic");
    expect(result.summary).toBe("Claude summary");
    expect(result.highlights).toEqual(["a", "b"]);
  });

  it("parses OpenAI JSON response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  summary: "OpenAI summary",
                  highlights: ["x", "y", "z"],
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    const provider = new OpenAIProvider({ apiKey: "openai-key" });
    const result = await provider.summarize(buildContext());

    expect(result.providerId).toBe("openai");
    expect(result.summary).toBe("OpenAI summary");
    expect(result.highlights).toEqual(["x", "y", "z"]);
  });
});

function buildContext(): AIProviderContext {
  const transcript: TranscriptDocument = {
    version: "1",
    exportedAt: "2026-02-19T00:00:00.000Z",
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
        createdAt: "2026-02-19T00:00:00.000Z",
        editedAt: null,
        pinned: false,
        content: "Need help with checkout error",
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

  return {
    transcript,
    report: undefined,
    options: {
      enabled: true,
      maxHighlights: 5,
    },
  };
}
