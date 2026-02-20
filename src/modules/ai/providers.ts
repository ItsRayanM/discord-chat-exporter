import type { AIProvider, AIProviderContext, AIResult } from "@/types.js";

const DEFAULT_SUMMARY_INSTRUCTION =
  "You summarize Discord chat transcripts for incident/ticket logs. Keep it factual, concise, and deterministic.";

export class HeuristicAIProvider implements AIProvider {
  public readonly id = "heuristic";

  public async summarize(ctx: AIProviderContext): Promise<AIResult> {
    const topUsers = ctx.report?.messageCountPerUser.slice(0, 3) ?? [];
    const topWords = ctx.report?.wordFrequency.slice(0, 8).map((item) => item.word) ?? [];
    const highlights =
      ctx.report?.highlights
        .slice(0, ctx.options?.maxHighlights ?? 8)
        .map((entry) => `Message ${entry.messageId}: ${entry.reason}`) ?? [];

    const firstMessageAt = ctx.transcript.messages[0]?.createdAt;
    const lastMessageAt = ctx.transcript.messages[ctx.transcript.messages.length - 1]?.createdAt;

    const summaryParts = [
      `Conversation exported with ${ctx.transcript.messages.length} messages.`,
      firstMessageAt && lastMessageAt
        ? `Time range: ${firstMessageAt} to ${lastMessageAt}.`
        : "Time range unavailable.",
      topUsers.length > 0
        ? `Most active participants: ${topUsers.map((user) => `${user.username} (${user.count})`).join(", ")}.`
        : "No participant activity summary available.",
      topWords.length > 0
        ? `Frequent terms: ${topWords.join(", ")}.`
        : "No dominant keywords detected.",
    ];

    return {
      providerId: this.id,
      summary: summaryParts.join(" "),
      highlights,
      model: "heuristic-v1",
    };
  }
}

export interface OpenAICompatibleProviderConfig {
  id?: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export class OpenAICompatibleProvider implements AIProvider {
  public readonly id: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;

  public constructor(config: OpenAICompatibleProviderConfig) {
    this.id = config.id ?? "openai-compatible";
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? "https://api.openai.com/v1";
    this.model = config.model ?? "gpt-4.1-mini";
  }

  public async summarize(ctx: AIProviderContext): Promise<AIResult> {
    const highlightsLimit = Math.max(3, ctx.options?.maxHighlights ?? 8);

    const payload = {
      model: this.model,
      temperature: ctx.options?.temperature ?? 0.2,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "transcript_summary",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              summary: { type: "string" },
              highlights: {
                type: "array",
                items: { type: "string" },
                minItems: 1,
                maxItems: highlightsLimit,
              },
            },
            required: ["summary", "highlights"],
          },
        },
      },
      messages: [
        {
          role: "system",
          content: DEFAULT_SUMMARY_INSTRUCTION,
        },
        {
          role: "user",
          content: buildPrompt(ctx),
        },
      ],
    };

    const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI provider failed: HTTP ${response.status} - ${body}`);
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI provider returned empty content.");
    }

    const parsed = parseStructuredOutput(content, highlightsLimit);

    return {
      providerId: this.id,
      summary: parsed.summary,
      highlights: parsed.highlights,
      model: this.model,
    };
  }
}

export interface OpenAIProviderConfig {
  apiKey: string;
  model?: string;
}

export class OpenAIProvider extends OpenAICompatibleProvider {
  public constructor(config: OpenAIProviderConfig) {
    super({
      id: "openai",
      apiKey: config.apiKey,
      baseUrl: "https://api.openai.com/v1",
      model: config.model ?? "gpt-4.1-mini",
    });
  }
}

export interface GoogleGeminiProviderConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  id?: string;
}

export class GoogleGeminiProvider implements AIProvider {
  public readonly id: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;

  public constructor(config: GoogleGeminiProviderConfig) {
    this.id = config.id ?? "gemini";
    this.apiKey = config.apiKey;
    this.model = config.model ?? "gemini-1.5-pro";
    this.baseUrl = config.baseUrl ?? "https://generativelanguage.googleapis.com/v1beta";
  }

  public async summarize(ctx: AIProviderContext): Promise<AIResult> {
    const highlightsLimit = Math.max(3, ctx.options?.maxHighlights ?? 8);

    const payload = {
      systemInstruction: {
        parts: [{ text: DEFAULT_SUMMARY_INSTRUCTION }],
      },
      contents: [{ role: "user", parts: [{ text: buildPrompt(ctx) }] }],
      generationConfig: {
        temperature: ctx.options?.temperature ?? 0.2,
        responseMimeType: "application/json",
      },
    };

    const endpoint = `${this.baseUrl.replace(/\/$/, "")}/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Gemini provider failed: HTTP ${response.status} - ${body}`);
    }

    const json = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const text =
      json.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("\n")
        .trim() ?? "";

    if (!text) {
      throw new Error("Gemini provider returned empty content.");
    }

    const parsed = parseStructuredOutput(text, highlightsLimit);

    return {
      providerId: this.id,
      summary: parsed.summary,
      highlights: parsed.highlights,
      model: this.model,
    };
  }
}

export interface AnthropicClaudeProviderConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  id?: string;
  anthropicVersion?: string;
}

export class AnthropicClaudeProvider implements AIProvider {
  public readonly id: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly anthropicVersion: string;

  public constructor(config: AnthropicClaudeProviderConfig) {
    this.id = config.id ?? "anthropic";
    this.apiKey = config.apiKey;
    this.model = config.model ?? "claude-3-5-sonnet-latest";
    this.baseUrl = config.baseUrl ?? "https://api.anthropic.com/v1";
    this.anthropicVersion = config.anthropicVersion ?? "2023-06-01";
  }

  public async summarize(ctx: AIProviderContext): Promise<AIResult> {
    const highlightsLimit = Math.max(3, ctx.options?.maxHighlights ?? 8);

    const payload = {
      model: this.model,
      max_tokens: 900,
      temperature: ctx.options?.temperature ?? 0.2,
      system: DEFAULT_SUMMARY_INSTRUCTION,
      messages: [
        {
          role: "user",
          content: buildPrompt(ctx),
        },
      ],
    };

    const endpoint = `${this.baseUrl.replace(/\/$/, "")}/messages`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": this.anthropicVersion,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Anthropic provider failed: HTTP ${response.status} - ${body}`);
    }

    const json = (await response.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };

    const text =
      json.content
        ?.filter((block) => block.type === "text" && typeof block.text === "string")
        .map((block) => block.text ?? "")
        .join("\n")
        .trim() ?? "";

    if (!text) {
      throw new Error("Anthropic provider returned empty content.");
    }

    const parsed = parseStructuredOutput(text, highlightsLimit);

    return {
      providerId: this.id,
      summary: parsed.summary,
      highlights: parsed.highlights,
      model: this.model,
    };
  }
}

function parseStructuredOutput(
  rawText: string,
  highlightsLimit: number,
): { summary: string; highlights: string[] } {
  const candidates = extractJsonCandidates(rawText);

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as { summary?: unknown; highlights?: unknown };
      if (typeof parsed.summary !== "string") {
        continue;
      }

      const highlightsArray = Array.isArray(parsed.highlights)
        ? parsed.highlights.filter((entry): entry is string => typeof entry === "string")
        : [];

      return {
        summary: parsed.summary,
        highlights: highlightsArray.slice(0, highlightsLimit),
      };
    } catch {
      continue;
    }
  }

  throw new Error("AI provider returned non-JSON or invalid schema content.");
}

function extractJsonCandidates(text: string): string[] {
  const trimmed = text.trim();
  const candidates: string[] = [trimmed];

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    candidates.push(fenced[1].trim());
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(trimmed.slice(firstBrace, lastBrace + 1));
  }

  return [...new Set(candidates.filter((candidate) => candidate.length > 0))];
}

function buildPrompt(ctx: AIProviderContext): string {
  const sampledMessages = ctx.transcript.messages
    .slice(-Math.min(ctx.transcript.messages.length, 300))
    .map((message) => ({
      id: message.id,
      createdAt: message.createdAt,
      author: message.author?.globalName ?? message.author?.username ?? "Unknown",
      content: message.content,
      attachments: message.attachments.length,
      reactions: message.reactions.length,
    }));

  const report = ctx.report
    ? {
        topUsers: ctx.report.messageCountPerUser.slice(0, 5),
        topWords: ctx.report.wordFrequency.slice(0, 20),
        peakHours: ctx.report.peakActivityHours,
      }
    : undefined;

  return JSON.stringify(
    {
      instructions:
        ctx.options?.prompt ??
        "Summarize the conversation and list important highlights for archival/ticket resolution.",
      outputSchema: {
        summary: "string",
        highlights: ["string"],
      },
      transcriptMeta: {
        messageCount: ctx.transcript.messages.length,
        channel: ctx.transcript.channel,
        exportedAt: ctx.transcript.exportedAt,
      },
      analytics: report,
      sampledMessages,
    },
    null,
    2,
  );
}
