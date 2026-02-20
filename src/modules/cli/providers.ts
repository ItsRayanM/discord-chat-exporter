import type { createExporter } from "@/core/exporter.js";
import {
  AnthropicClaudeProvider,
  GoogleGeminiProvider,
  OpenAICompatibleProvider,
  OpenAIProvider,
} from "@/modules/ai/index.js";

export function registerPopularAIProviders(exporter: ReturnType<typeof createExporter>): void {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    exporter.registerAIProvider(new OpenAIProvider({ apiKey: openaiKey }));
  }

  const geminiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (geminiKey) {
    exporter.registerAIProvider(
      new GoogleGeminiProvider({
        apiKey: geminiKey,
        model: process.env.GEMINI_MODEL,
      }),
    );
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    exporter.registerAIProvider(
      new AnthropicClaudeProvider({
        apiKey: anthropicKey,
        model: process.env.ANTHROPIC_MODEL,
      }),
    );
  }

  const openaiCompatibleKey = process.env.OPENAI_COMPATIBLE_API_KEY;
  if (openaiCompatibleKey) {
    exporter.registerAIProvider(
      new OpenAICompatibleProvider({
        id: process.env.OPENAI_COMPATIBLE_PROVIDER_ID ?? "openai-compatible",
        apiKey: openaiCompatibleKey,
        baseUrl: process.env.OPENAI_COMPATIBLE_BASE_URL ?? "https://api.openai.com/v1",
        model: process.env.OPENAI_COMPATIBLE_MODEL ?? "gpt-4.1-mini",
      }),
    );
  }
}
