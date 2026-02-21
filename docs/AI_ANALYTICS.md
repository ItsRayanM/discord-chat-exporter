# Analytics & AI Integration

The Analytics engine generates high-value metrics, heatmap tracking, and connects to Major Large Language Models (LLMs) to automatically write summaries for long channels/tickets.

---

## 📊 Analytics Configuration

You can enable the analytics payload generation inside the `request`:

```ts
analytics: {
  enabled: true,
  includeHeatmap: true,
  topWordsLimit: 100, // min 5
  topMentionedLimit: 25, // min 3
  responseWindowMinutes: 5, // min 1
}
```

**CLI Flags:** `--analytics`, `--analytics-heatmap`, `--top-words 100`, `--top-mentions 25`

### Generated Metrics Payload (`AnalyticsReport`)

The Analytics Report payload generates the following data nodes:

- `messageCountPerUser`
- `attachmentStats` (total attachments, mapped by content type and bytes)
- `reactionStats` (total emoji entries vs unique messages with reactions)
- `wordFrequency`
- `activityTimelineByHour` (UTC hour buckets)
- `peakActivityHours`
- `topMentionedUsers`
- `responseTimeMetrics` (average/median/p95 seconds)
- `conversationHeatmap` (if enabled)
- `highlights` (notable message IDs + computational reasoning)

---

## 🤖 AI Summary Flow

You can pipe the final parsed transcript into an AI Provider when `analytics.ai.enabled = true`.

### Architecture

The Exporter packages transcript metadata, a sampling of the last N messages, analytics summaries, and built-in prompting instructions. The expected model is rigorously instructed to return exact JSON matching the schema below:

```json
{
  "summary": "string",
  "highlights": ["string"]
}
```

> [!WARNING]  
> If the provider hallucinates, returns an invalid JSON schema, or fails to connect, the engine gracefully catches the error and records it inside `warnings[]` without crashing the export pipeline.

---

## 🧠 Built-in AI Providers

You must register your AI Logic Provider before executing the `exportChannel()` pipeline.

| Provider Constructor           | Description                                                                         | Default Model Called         |
| ------------------------------ | ----------------------------------------------------------------------------------- | ---------------------------- |
| **`heuristic`** _(Default)_    | Local deterministic summary. Doesn't use external network APIs.                     | N/A                          |
| **`OpenAIProvider`**           | Official OpenAI API Wrapper.                                                        | `gpt-4o-mini`                |
| **`GoogleGeminiProvider`**     | Google Gemini API Wrapper.                                                          | `gemini-1.5-pro`             |
| **`AnthropicClaudeProvider`**  | Anthropic Messages API Wrapper.                                                     | `claude-3-5-sonnet-latest`   |
| **`OpenAICompatibleProvider`** | Raw adapter for 3rd Party systems using `/chat/completions` (e.g., Groq, Together). | You supply the model string. |

### Registering Providers manually

```ts
import { OpenAIProvider } from "@rayanmustafa/discord-chat-exporter";

// Manually register via API key
exporter.registerAIProvider(
  new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY! }),
);
```

### Automatic Registration

> [!TIP]  
> If your system shell contains standard environment variables (like `OPENAI_API_KEY`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`), the `createExporter` engine automatically detects and registers these providers at runtime. You don't need to manually register them in TypeScript if the keys are present in `.env`.

---

## 🧩 Building Custom AI Adapters

If you want to plug the logic into your own company's internal model infra, implement the `AIProvider` Interface:

```ts
interface AIProvider {
  id: string;
  summarize(ctx: AIProviderContext): Promise<AIResult>;
}
```
