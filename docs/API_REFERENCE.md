# API Reference

This document covers the primary TypeScript/Node.js interfaces exported from `src/index.ts`.

---

## 📦 Main Exports

### Core Classes & Methods

| Export Name                             | Description                                                                |
| --------------------------------------- | -------------------------------------------------------------------------- |
| **`createExporter(config?)`**           | Factory initialization of the core pipeline engine.                        |
| **`DiscordChatExporter`**               | The underlying concrete exporter class for manual instantiation.           |
| **`createTicketCloseHandler(options)`** | Helper pipeline that safely stops, exports, and cleans up Discord tickets. |
| **`startLiveRecorder(options)`**        | Spawns the NDJSON `discord.js` listener.                                   |

### AI Providers

| Export Name                    | Platform Targeted                                                     |
| ------------------------------ | --------------------------------------------------------------------- |
| **`HeuristicAIProvider`**      | Native basic matching based on text analysis.                         |
| **`OpenAIProvider`**           | Interface for standard OpenAI models.                                 |
| **`GoogleGeminiProvider`**     | Interface for standard Google Gemini models.                          |
| **`AnthropicClaudeProvider`**  | Interface for standard Claude 3+ APIs.                                |
| **`OpenAICompatibleProvider`** | Adapter for OpenAI-format APIs like Groq, Mistral, Together, and xAI. |

### Core Types

| Category         | Types List                                                                    |
| ---------------- | ----------------------------------------------------------------------------- |
| **Pipelines**    | `ExportRequest`, `ExportResult`, `OutputFormat`                               |
| **Filtering**    | `FilterGroup`, `FilterCondition`, `MessagePredicate`                          |
| **Rendering**    | `RendererPlugin`, `RenderContext`, `RenderArtifact`                           |
| **Intelligence** | `AIProvider`, `AIProviderContext`, `AIResult`                                 |
| **Databases**    | `DatabaseDeliveryAdapter`, `DatabaseDeliveryContext`, `OutputDatabaseOptions` |
| **Events**       | `TicketCloseHandlerOptions`, `RecorderStartOptions`, `LiveRecorderHandle`     |

---

## 🛠 `DiscordChatExporter` Class Methods

### `registerRenderer(plugin: RendererPlugin): void`

Registers a custom renderer keyed by `plugin.format`.

### `registerAIProvider(provider: AIProvider): void`

Registers or overrides the default AI provider referenced by `provider.id`.

### `registerDatabaseAdapter(adapter: DatabaseDeliveryAdapter): void`

Allows injection of a custom database sink adapter using `adapter.id`.

### `exportChannel(request: ExportRequest): Promise<ExportResult>`

Executes the full export pipeline.

**Under the hood Execution Steps:**

1. Validate Request definitions.
2. Resolve the Target Output Plan.
3. Collect messages & threads dynamically.
4. Normalize payloads into a standard transcript schema.
5. Merge live recorder events (if applicable).
6. Apply incremental checkpoints/cutoffs.
7. Execute filter engine limits.
8. Process external attachments.
9. Generate the Analytics report.
10. Run AI summarization prompts.
11. Render chunks & formats.
12. Zip / Compile archives and PDFs.
13. Save standard state tokens back to disk.
14. Deliver final artifacts to Cloud Storage, Discord channel, or Databases.

---

## 🧩 Shared Interface Definitions

### `ExportRequest`

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

### `OutputOptions`

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
    includeFileList?: boolean;
    getContent?: (ctx: DiscordDeliveryContext) => string | Promise<string>;
    embed?: DiscordEmbedData;
    getEmbed?: (
      ctx: DiscordDeliveryContext,
    ) => DiscordEmbedData | Promise<DiscordEmbedData>;
    embeds?: DiscordEmbedData[];
    getEmbeds?: (
      ctx: DiscordDeliveryContext,
    ) => DiscordEmbedData[] | Promise<DiscordEmbedData[]>;
  };

  database?: {
    enabled?: boolean;
    driver?: "sqlite" | "postgres" | "mysql" | "mongodb" | "mongoose" | string;
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

### `ExportResult`

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

---

## 🛠 Extending Architectures

### Custom Renderer Plugin Integration

You can inject any custom format output by supplying a valid mapping pipeline template:

```ts
interface RendererPlugin {
  id: string;
  format: OutputFormat | string;
  supportsStreaming: boolean;
  render(ctx: RenderContext): Promise<RenderArtifact[]>;
}
```

### Custom Database Adapter

Provide a way to sink unstructured JSON metrics right into your cloud layer:

```ts
interface DatabaseDeliveryAdapter {
  id: string; // e.g. "firestore"
  persist(ctx: DatabaseDeliveryContext): Promise<DatabaseDeliveryResult>;
}

// Concrete Initialization snippet
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
