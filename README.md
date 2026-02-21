<div align="center">

# @rayanmustafa/discord-chat-exporter

**High-fidelity Discord transcript exporter for bot-based workflows.**

[![npm version](https://img.shields.io/npm/v/@rayanmustafa/discord-chat-exporter.svg)](https://npmjs.org/package/@rayanmustafa/discord-chat-exporter)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

</div>

Welcome to the definitive backend-focused, highly customizable Discord channel export engine. Designed for complete compliance with Discord’s API using _Bot Tokens Only_, this tool safely pulls full thread histories, downloads attachments, generates beautiful output formats, and pushes data to your favorite cloud platforms and databases.

> [!NOTE]  
> Complete documentation is available in `docs/README.md` and the full `docs/` index.

---

## 📑 Table of Contents

- [What is implemented now](#-what-is-implemented-now)
- [Architecture Overview](#-architecture-overview)
- [Installation](#-installation)
- [CLI Quick Start](#-cli-quick-start)
- [TypeScript API Reference](#-typescript-api-reference)
- [Integrations (AI, Databases, Cloud)](#-integrations)
- [Important Limits](#-important-limits)
- [Internal Architecture & Development](#-internal-architecture--development)

---

## 🍎 What is implemented now

### Core Capabilities

- **Bot-Token-Only Flow**: Fully Discord API compliant.
- **Deep History Extraction**: Channel + thread history export with pagination and retry handling.
- **Canonical Model**: Preserves raw Discord message payloads for historic accuracy.
- **Advanced Filtering**: Combine `AND`/`OR` conditions, nested groups, and filter by content, state, type, time, or user.
- **Attachment Handling Modes**: `external-link`, `local-download`, `both`, or `base64-inline`.
- **Live Recorder**: Capture `create`, `update`, `delete`, and `reaction` events locally (NDJSON format).
- **Ticket Handling**: Ticket close helper for `discord.js` integrations, plus an advanced handler (`createAdvancedTicketCloseHandler`) with post-actions.

### Output Formats

| Format Group         | Supported Formats                                                                |
| -------------------- | -------------------------------------------------------------------------------- |
| **JSON**             | `json-full`, `json-clean`, `analytics-json`                                      |
| **Text & Documents** | `txt`, `md`, `csv`, `pdf` (req. `playwright`), `xml`, `docx` (req. `docx`)       |
| **HTML UI**          | `html-single`, `html-bundle` (Custom templates via `--html-template`)            |
| **Databases**        | `sqlite` (req. `better-sqlite3`), and other SQL/NoSQL targets (see Integrations) |
| **Archives**         | `zip` with optional AES-256 encryption (`archiver-zip-encrypted`)                |

### Enterprise Grade Features

- **Incremental & Checkpoint**: Incremental export state, split/chunk exports by message count/byte size.
- **Delta Mode**: Checkpoint and live recorder merge (best-effort).
- **Redaction Engine**: Native PII filters (email, phone, tokens) and custom regex strings.
- **Compliance Artifacts**: End-to-end manifest and optional Ed25519 signatures.
- **Batch Processing**: Isolated per-channel exports with a master export index (`exportBatch`).
- **Monitoring & CLI**: Monitoring hooks (`monitoring.onEvent`), CLI progress reporting via JSONL, and a built-in scheduler (`schedule add/list/run/daemon`).
- **Context7 + AI Support**: Mention `@rayanmustafa/discord-chat-exporter` in an AI IDE (like Cursor) for automatic CLI script generation!

---

## 🗺️ Architecture Overview

```mermaid
graph TD
    A[Discord API] -->|Bot Token| B(Core Data Extract)
    B --> C{Filtering & Attachments}
    C --> D[Redaction & PII Filters]
    D --> E[Rendering Pipeline]

    E --> F[HTML / JSON / PDF / Zip]
    E --> G[Database Sinks]
    E --> H[Cloud & Webhooks]
    E --> I[AI Summaries]

    G -.-> J[(Postgres / MongoDB / S3 / R2)]
```

---

## 📦 Installation

Install the core package using NPM:

```bash
npm i @rayanmustafa/discord-chat-exporter
```

### Optional Format Dependencies

Install any database drivers or external tools you intend to use alongside it:

```bash
npm i playwright better-sqlite3 docx archiver-zip-encrypted pg mysql2 mongodb mongoose \
  @aws-sdk/client-s3 @google-cloud/storage @azure/storage-blob @slack/webhook \
  node-cron json-canonicalize libphonenumber-js flexsearch
```

---

## 🚀 CLI Quick Start

### Basic Export with Feature Enhancements

```bash
npx dcexport export \
  --token "$DISCORD_BOT_TOKEN" \
  --channel 123456789012345678 \
  --formats html-single,json-full,analytics-json,pdf,zip \
  --attachments-mode both \
  --watermark "Internal Use" \
  --read-only \
  --toc \
  --split-max-messages 50000 \
  --incremental \
  --analytics \
  --analytics-heatmap \
  --ai \
  --ai-provider gemini \
  --output-target both \
  --discord-output-channel 987654321098765432 \
  --db-sqlite ./exports/transcripts.sqlite \
  --out ./exports
```

### Direct Delivery to Discord Channel

```bash
npx dcexport export \
  --token "$DISCORD_BOT_TOKEN" \
  --channel 123456789012345678 \
  --formats html-single,json-full \
  --output-target discord-channel \
  --discord-output-channel 987654321098765432 \
  --discord-output-content "Transcript ready"
```

### Cloud Storage, Redaction, and Webhooks

```bash
npx dcexport export \
  --token "$DISCORD_BOT_TOKEN" \
  --channel 123456789012345678 \
  --formats html-single,json-full,zip \
  --storage-enable --storage-provider s3 \
  --storage-bucket my-transcripts --storage-region eu-central-1 --storage-prefix discord \
  --webhook-generic https://example.com/hook \
  --redaction --redaction-profiles email,phone,token \
  --delta --delta-checkpoint ./.dcexport/delta-123.json \
  --manifest \
  --sign-ed25519-key ./keys/ed25519-private.pem \
  --sign-key-id key-2026-01 \
  --progress-jsonl ./exports/progress.jsonl \
  --out ./exports
```

### Batch Processing

```bash
npx dcexport export-batch \
  --token "$DISCORD_BOT_TOKEN" \
  --channels 111111111111111111,222222222222222222,333333333333333333 \
  --formats html-bundle,json-full \
  --out ./exports \
  --batch-concurrency 3 \
  --batch-merged
```

### Tools & Schedulers

```bash
# Doctor checks
npx dcexport doctor --token "$DISCORD_BOT_TOKEN" --channel 123456789012345678

# Start / Stop Live Recorder
npx dcexport record start --token "$DISCORD_BOT_TOKEN" --out ./.dcexport/events.ndjson
npx dcexport record stop

# Scheduler
npx dcexport schedule add --job-file ./jobs.json --state ./.dcexport/scheduler-state.json
npx dcexport schedule daemon --jobs ./jobs.json --state ./.dcexport/scheduler-state.json
```

---

## 💻 TypeScript API Reference

### Full Configuration Example

```ts
import {
  createExporter,
  GoogleGeminiProvider,
  AnthropicClaudeProvider,
  OpenAIProvider,
} from "@rayanmustafa/discord-chat-exporter";

const exporter = createExporter();

// Register AI Providers
exporter.registerAIProvider(
  new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY! }),
);
exporter.registerAIProvider(
  new GoogleGeminiProvider({ apiKey: process.env.GEMINI_API_KEY! }),
);
exporter.registerAIProvider(
  new AnthropicClaudeProvider({ apiKey: process.env.ANTHROPIC_API_KEY! }),
);

const result = await exporter.exportChannel({
  token: process.env.DISCORD_BOT_TOKEN!,
  channelId: "123456789012345678",
  formats: ["html-single", "json-full", "analytics-json", "zip"],
  attachments: { mode: "both", downloadConcurrency: 4 },

  // Custom Display & Render options
  render: {
    watermark: "Internal Use",
    readOnly: true,
    includeTableOfContents: true,
    splitPolicy: { maxMessagesPerChunk: 50000 },
  },

  // Output and Logging Delivery
  output: {
    dir: "./exports",
    target: "both",
    discord: {
      channelId: "987654321098765432",
      content: "Ticket transcript exported",
    },
    database: {
      enabled: true,
      driver: "postgres",
      connectionString: "postgres://user:pass@localhost:5432/transcripts",
      table: "exports_log",
    },
    storage: {
      enabled: true,
      providers: [
        {
          kind: "s3",
          bucket: "my-transcripts",
          region: "eu-central-1",
          keyPrefix: "discord",
        },
      ],
    },
    webhooks: {
      enabled: true,
      targets: [
        { kind: "generic", url: "https://example.com/webhooks/transcript" },
      ],
    },
    basename: "ticket-1234",
    incremental: { enabled: true },
  },

  // Extra Parsing
  analytics: {
    enabled: true,
    includeHeatmap: true,
    ai: { enabled: true, providerId: "gemini" },
  },
  redaction: { enabled: true, profiles: ["email", "phone", "token"] },
  delta: {
    enabled: true,
    checkpointFile: "./exports/.dcexport/delta-123.json",
  },
  compliance: {
    manifest: { enabled: true },
    signature: {
      enabled: true,
      privateKeyPath: "./keys/ed25519-private.pem",
      keyId: "key-2026-01",
    },
  },
  monitoring: {
    onEvent(event) {
      console.log(event.kind, event);
    },
  },
});

console.log(result.stats, result.analyticsReport, result.aiResult);
```

### Custom Database Integrations

Instead of native drivers, you can register custom sinks dynamically:

```ts
exporter.registerDatabaseAdapter({
  id: "firestore",
  async persist(ctx) {
    // Write ctx.transcript, ctx.stats, or ctx.request to Firestore
    return {
      driver: "firestore",
      exportId: "doc_123",
      location: "firestore.exports/doc_123",
    };
  },
});
```

---

## 🔗 Integrations

### Database Drivers

You can log and pipeline messages to relational or document databases automatically. Ensure the target dependency is installed (`npm i pg`, `npm i mongodb`, etc.):

- `sqlite` (local file DB)
- `postgres`
- `mysql`
- `mongodb`
- `mongoose`

### AI Capabilities

Native AI plugins parse large channels intelligently and return analytics and summaries.

- `openai`: Register `OpenAIProvider` with `OPENAI_API_KEY`.
- `gemini`: Register `GoogleGeminiProvider` with `GEMINI_API_KEY` (or `GOOGLE_API_KEY`).
- `anthropic`: Register `AnthropicClaudeProvider` with `ANTHROPIC_API_KEY`.
- `openai-compatible`: Use `OpenAICompatibleProvider` for systems with OpenAI-style APIs like Groq, Mistral, Together, and xAI.

### Cloud Storage Sinks (`output.storage`)

- `s3` (AWS S3, Cloudflare R2, MinIO)
- `gcs` (Google Cloud Storage)
- `azure-blob` (Azure Object Storage)

### Output Delivery Targets

Choose where exports deploy naturally:

- `filesystem` (Default: Direct export to local `./out` folder).
- `discord-channel` (Upload artifacts directly out to a Discord channel. Customize via `content`/`getContent`, embeds via `embed`/`getEmbeds`, file list via `{{files}}` or `includeFileList`).
- `both` (Save locally AND upload to Discord).

---

## ⚠️ Important Limits

> [!WARNING]
>
> - **Historic Information Loss**: Historic Edit/Delete timelines cannot be reconstructed entirely from Discord REST APIs (Use the live `-record` feature for complete audit trails).
> - **Content Intent Requirements**: Complete message content requires the `Message Content Intent` permission toggled in your bot application page.
> - **Temporary Links**: Discord signed attachment URLs may expire. The exporter retries connections best-effort.
> - **Interactive Data**: Certain Interaction and Modal payload histories are only accessible via the Live recording pipeline.

---

## 🏗️ Internal Architecture & Development

Our scalable, layered internal structure safely divides parsing from CLI presentation:

- **`src/modules/*`**: Core engine modules separated logically:
  - `domain`: Contracts & Invariants.
  - `application`: Service Use-Cases & orchestration.
  - `infrastructure`: Real-world adapters & HTTP IO capabilities.
- **`src/modules/cli/*`**: Typed CLI parsing via Commander, runtime parameter generation validated by Zod.
- **`src/shared/*`**: Tooling interfaces:
  - `shared/utils/snowflake.ts`
  - `shared/async/concurrency.ts` (powered mechanically via `p-limit`)
  - `shared/json/safe-json.ts`
  - `shared/errors/*`
- **Typing Integrity**: Public endpoints correctly structured via `src/index.ts` and `src/types.ts`.

### Development Scripts

```bash
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run build
```
