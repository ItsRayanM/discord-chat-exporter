# AI and Analytics

## Analytics Module

Enabled with:

```ts
analytics: { enabled: true }
```

Also CLI:

- `--analytics`

## Analytics Options

- `includeHeatmap`
- `topWordsLimit` (min 5)
- `topMentionedLimit` (min 3)
- `highlightCount` (min 3)
- `responseWindowMinutes` (min 1)
- `ai` block (for AI summaries)

## Generated Metrics (`AnalyticsReport`)

- `messageCountPerUser`
- `attachmentStats`
  - total attachments
  - by content type
  - total bytes
- `reactionStats`
  - total reaction entries
  - messages with reactions
- `wordFrequency`
- `activityTimelineByHour` (UTC hour buckets)
- `peakActivityHours`
- `topMentionedUsers`
- `responseTimeMetrics`
  - sampled transitions
  - average/median/p95 seconds
- `conversationHeatmap` (optional)
- `highlights` (notable message IDs + reasons)

## AI Summary Flow

AI summary runs only when `analytics.ai.enabled = true`.

Input includes:

- transcript metadata
- sampled last messages
- optional analytics summary
- prompt instructions/schema

Expected model output schema:

```json
{
  "summary": "string",
  "highlights": ["string"]
}
```

If provider returns invalid schema/non-JSON, exporter records warning.

## Built-in AI Providers

### `heuristic`

- Local deterministic summary
- No network/API key required

### `openai`

- Wrapper over OpenAI-compatible provider
- Default model: `gpt-4.1-mini`

### `openai-compatible`

- Generic `/chat/completions` compatible provider
- Configurable `baseUrl`, `model`, `id`

### `gemini`

- Google Gemini `generateContent` path
- Default model: `gemini-1.5-pro`

### `anthropic`

- Anthropic Messages API
- Default model: `claude-3-5-sonnet-latest`

## Provider Registration

```ts
exporter.registerAIProvider(new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY! }));
```

You can also provide your own provider implementing:

```ts
interface AIProvider {
  id: string;
  summarize(ctx: AIProviderContext): Promise<AIResult>;
}
```

## Auto-Registration

Popular providers auto-register if matching environment variables exist (see `docs/INSTALLATION.md`).
