# API Reference

Public exports come from `src/index.ts`.

## Main Exports

- `createExporter(config?)`
- `DiscordChatExporter`
- `createTicketCloseHandler(options)`
- `startLiveRecorder(options)`

AI classes:

- `HeuristicAIProvider`
- `OpenAIProvider`
- `OpenAICompatibleProvider`
- `GoogleGeminiProvider`
- `AnthropicClaudeProvider`

Types:

- `ExportRequest`, `ExportResult`, `OutputFormat`
- `FilterGroup`, `FilterCondition`, `MessagePredicate`
- `RendererPlugin`, `RenderContext`, `RenderArtifact`
- `AIProvider`, `AIProviderContext`, `AIResult`
- `DatabaseDeliveryAdapter`, `DatabaseDeliveryContext`, `OutputDatabaseOptions`
- `TicketCloseHandlerOptions`, `RecorderStartOptions`, `LiveRecorderHandle`

## `DiscordChatExporter`

### `registerRenderer(plugin: RendererPlugin): void`

Registers custom renderer keyed by `plugin.format`.

### `registerAIProvider(provider: AIProvider): void`

Registers/overrides AI provider by `provider.id`.

### `registerDatabaseAdapter(adapter: DatabaseDeliveryAdapter): void`

Registers custom database sink adapter by normalized `adapter.id`.

### `exportChannel(request: ExportRequest): Promise<ExportResult>`

Full export pipeline:

1. validate request
2. resolve output plan
3. collect messages + threads
4. normalize into transcript
5. merge recorder events (optional)
6. apply incremental cutoff (optional)
7. apply filter engine + predicate
8. process attachments
9. generate analytics report (optional)
10. generate AI summary (optional)
11. render formats/chunks
12. render ZIP/PDF (if requested)
13. save incremental state (optional)
14. deliver to Discord/database targets (if enabled)

### `startLiveRecorder(options: RecorderStartOptions): Promise<LiveRecorderHandle>`

Starts `discord.js` live recorder writing NDJSON events.

## `ExportRequest` Overview

```ts
interface ExportRequest {
  token: string;
  guildId?: string;
  channelId: string;
  threadIds?: string[];
  formats: Array<OutputFormat | string>;
  filters?: FilterGroup;
  predicate?: MessagePredicate;
  attachments?: AttachmentOptions;
  render?: RenderOptions;
  output: OutputOptions;
  recorder?: RecorderMergeOptions;
  analytics?: AnalyticsOptions;
  filterContext?: FilterContextMaps;
}
```

## `OutputOptions` Overview

```ts
interface OutputOptions {
  dir?: string;
  basename?: string;
  compress?: boolean;
  target?: "filesystem" | "discord-channel" | "both";
  retainFiles?: boolean;
  discord?: {
    channelId: string;
    token?: string;
    content?: string;
  };
  database?: {
    enabled?: boolean;
    driver?: string;
    sqlitePath?: string;
    connectionString?: string;
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    databaseName?: string;
    table?: string;
    collection?: string;
    tls?: boolean;
    options?: Record<string, unknown>;
  };
  encryption?: {
    enabled?: boolean;
    password?: string;
    method?: "zip-aes256";
  };
  incremental?: {
    enabled?: boolean;
    stateFile?: string;
  };
}
```

## `ExportResult` Overview

```ts
interface ExportResult {
  files: RenderArtifact[];
  warnings: string[];
  limitations: string[];
  stats: ExportStats;
  analyticsReport?: AnalyticsReport;
  aiResult?: AIResult;
  checkpoints?: {
    incrementalStateFile?: string;
    lastMessageId?: string;
    chunkCount: number;
  };
  delivery?: {
    discord?: {
      channelId: string;
      messageIds: string[];
      uploadedFiles: number;
    };
    database?: {
      driver: string;
      exportId: string | number;
      location: string;
      metadata?: Record<string, unknown>;
    };
  };
}
```

## Custom Renderer Plugin

```ts
interface RendererPlugin {
  id: string;
  format: OutputFormat | string;
  supportsStreaming: boolean;
  render(ctx: RenderContext): Promise<RenderArtifact[]>;
}
```

## Custom Database Adapter

```ts
interface DatabaseDeliveryAdapter {
  id: string; // e.g. "firestore"
  persist(ctx: DatabaseDeliveryContext): Promise<DatabaseDeliveryResult>;
}
```

Example:

```ts
exporter.registerDatabaseAdapter({
  id: "firestore",
  async persist(ctx) {
    return {
      driver: "firestore",
      exportId: "doc_123",
      location: "firestore.exports/doc_123",
    };
  },
});
```
