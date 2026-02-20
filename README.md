# @rayanmustafa/discord-chat-exporter

High-fidelity Discord transcript exporter for bot-based workflows.

## Full Documentation

Complete docs are available in `docs/README.md` and the full `docs/` index.

## What is implemented now

- Bot-token-only export flow (Discord API compliant)
- Channel + thread history export with pagination and retry handling
- Canonical transcript model preserving raw Discord message payloads
- Advanced filters (`AND`/`OR`, nested groups, content/state/type/time/user filters)
- Attachment modes: `external-link`, `local-download`, `both`, `base64-inline`
- Output formats:
  - `json-full`, `json-clean`
  - `txt`, `md`, `csv`
  - `html-single`, `html-bundle`
  - `pdf` (optional dependency: `playwright`)
  - `xml`
  - `sqlite` (optional dependency: `better-sqlite3`)
  - `docx` (optional dependency: `docx`)
  - `zip` with optional AES-256 encryption (`archiver-zip-encrypted`)
  - `analytics-json`
- Future-phase features now implemented:
  - Incremental export state/checkpoints
  - Split/chunk export policy by messages/bytes
  - Watermark + read-only + TOC + accessibility HTML modes
  - Custom HTML templates via `render.html.templatePath` / `--html-template`
  - Analytics report module (counts, mentions, words, heatmap, response metrics, highlights)
  - AI summary plugin system with built-in `heuristic` provider
  - Google Gemini provider (`GoogleGeminiProvider`)
  - Anthropic Claude provider (`AnthropicClaudeProvider`)
  - OpenAI provider (`OpenAIProvider`)
  - OpenAI-compatible provider adapter (`OpenAICompatibleProvider`)
- Live recorder for `create/update/delete/reaction` events (NDJSON)
- Ticket close helper for `discord.js` integrations
- Advanced ticket close helper (`createAdvancedTicketCloseHandler`) with post-actions
- Output delivery targets:
  - `filesystem` (default)
  - `discord-channel` (upload artifacts directly to a Discord channel)
  - `both` (save locally and upload to Discord)
- Database sink (`output.database`) with built-in drivers:
  - `sqlite`, `postgres`, `mysql`, `mongodb`, `mongoose`
  - custom drivers via `exporter.registerDatabaseAdapter(...)`
- Batch export API (`exportBatch`) with per-channel isolation and master index
- Cloud storage sinks (`output.storage`): `s3` (S3/R2/MinIO), `gcs`, `azure-blob`
- Webhook delivery (`output.webhooks`): generic HTTP, Discord webhook, Slack webhook
- Redaction engine (`redaction`) for PII/token profiles + custom regex
- Delta export mode (`delta`) with checkpoint and recorder merge best-effort
- Compliance artifacts (`compliance`): manifest + optional Ed25519 signature
- Monitoring hooks (`monitoring.onEvent`) + CLI progress JSONL
- Scheduler commands: `schedule add/list/run/daemon`

## Install

```bash
npm i @rayanmustafa/discord-chat-exporter
```

Optional format dependencies:

```bash
npm i playwright better-sqlite3 docx archiver-zip-encrypted pg mysql2 mongodb mongoose \
  @aws-sdk/client-s3 @google-cloud/storage @azure/storage-blob @slack/webhook \
  node-cron json-canonicalize libphonenumber-js flexsearch
```

## API Example

```ts
import {
  createExporter,
  GoogleGeminiProvider,
  AnthropicClaudeProvider,
  OpenAIProvider,
} from "@rayanmustafa/discord-chat-exporter";

const exporter = createExporter();

exporter.registerAIProvider(new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY! }));
exporter.registerAIProvider(new GoogleGeminiProvider({ apiKey: process.env.GEMINI_API_KEY! }));
exporter.registerAIProvider(new AnthropicClaudeProvider({ apiKey: process.env.ANTHROPIC_API_KEY! }));

const result = await exporter.exportChannel({
  token: process.env.DISCORD_BOT_TOKEN!,
  channelId: "123456789012345678",
  formats: ["html-single", "json-full", "analytics-json", "zip"],
  attachments: {
    mode: "both",
    downloadConcurrency: 4,
  },
  render: {
    watermark: "Internal Use",
    readOnly: true,
    includeTableOfContents: true,
    splitPolicy: {
      maxMessagesPerChunk: 50000,
    },
  },
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
    incremental: {
      enabled: true,
    },
  },
  analytics: {
    enabled: true,
    includeHeatmap: true,
    ai: {
      enabled: true,
      providerId: "gemini",
    },
  },
  redaction: {
    enabled: true,
    profiles: ["email", "phone", "token"],
  },
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

Batch export example:

```ts
const batchResult = await exporter.exportBatch({
  token: process.env.DISCORD_BOT_TOKEN!,
  channelIds: ["111", "222", "333"],
  formats: ["html-bundle", "json-full"],
  output: { dir: "./exports" },
  batch: {
    concurrency: 3,
    includeMasterIndex: true,
  },
});

console.log(batchResult.stats, batchResult.masterIndex?.path);
```

Custom database adapter example:

```ts
exporter.registerDatabaseAdapter({
  id: "firestore",
  async persist(ctx) {
    // write ctx.transcript / ctx.stats / ctx.request to your database
    return {
      driver: "firestore",
      exportId: "doc_123",
      location: "firestore.exports/doc_123",
    };
  },
});
```

## Popular AI Providers

- `openai`: register `OpenAIProvider` with `OPENAI_API_KEY`
- `gemini`: register `GoogleGeminiProvider` with `GEMINI_API_KEY` (or `GOOGLE_API_KEY`)
- `anthropic`: register `AnthropicClaudeProvider` with `ANTHROPIC_API_KEY`
- `openai-compatible`: use `OpenAICompatibleProvider` for providers with OpenAI-style APIs (for example Groq, Mistral, Together, xAI)

## CLI Examples

```bash
# Provider keys (CLI auto-registers when present)
export OPENAI_API_KEY="..."
export GEMINI_API_KEY="..."
export ANTHROPIC_API_KEY="..."

# Rich export with future features
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

# Custom HTML template
npx dcexport export \
  --token "$DISCORD_BOT_TOKEN" \
  --channel 123456789012345678 \
  --formats html-single \
  --html-template ./templates/discord-like.html \
  --out ./exports

# PostgreSQL database sink
npx dcexport export \
  --token "$DISCORD_BOT_TOKEN" \
  --channel 123456789012345678 \
  --formats html-single,json-full \
  --db-driver postgres \
  --db-connection "postgres://user:pass@localhost:5432/transcripts" \
  --db-tls \
  --db-table exports_log \
  --out ./exports

# MongoDB / Mongoose sink
npx dcexport export \
  --token "$DISCORD_BOT_TOKEN" \
  --channel 123456789012345678 \
  --formats json-full \
  --db-driver mongodb \
  --db-connection "mongodb://localhost:27017/transcripts" \
  --db-collection exports_log \
  --out ./exports

# Direct delivery to Discord channel with temporary local storage
npx dcexport export \
  --token "$DISCORD_BOT_TOKEN" \
  --channel 123456789012345678 \
  --formats html-single,json-full \
  --output-target discord-channel \
  --discord-output-channel 987654321098765432 \
  --discord-output-content "Transcript ready"

# Batch export with master index + merged transcript
npx dcexport export-batch \
  --token "$DISCORD_BOT_TOKEN" \
  --channels 111111111111111111,222222222222222222,333333333333333333 \
  --formats html-bundle,json-full \
  --out ./exports \
  --batch-concurrency 3 \
  --batch-merged

# Cloud storage + webhook + redaction + delta + compliance signature
npx dcexport export \
  --token "$DISCORD_BOT_TOKEN" \
  --channel 123456789012345678 \
  --formats html-single,json-full,zip \
  --storage-enable \
  --storage-provider s3 \
  --storage-bucket my-transcripts \
  --storage-region eu-central-1 \
  --storage-prefix discord \
  --webhook-generic https://example.com/hook \
  --redaction \
  --redaction-profiles email,phone,token \
  --delta \
  --delta-checkpoint ./.dcexport/delta-123.json \
  --manifest \
  --sign-ed25519-key ./keys/ed25519-private.pem \
  --sign-key-id key-2026-01 \
  --progress-jsonl ./exports/progress.jsonl \
  --out ./exports

# Doctor checks
npx dcexport doctor --token "$DISCORD_BOT_TOKEN" --channel 123456789012345678

# Start detached recorder
npx dcexport record start --token "$DISCORD_BOT_TOKEN" --out ./.dcexport/events.ndjson

# Stop recorder
npx dcexport record stop

# Scheduler
npx dcexport schedule add --job-file ./jobs.json --state ./.dcexport/scheduler-state.json
npx dcexport schedule list --state ./.dcexport/scheduler-state.json
npx dcexport schedule run --job-id daily-ticket-exports --state ./.dcexport/scheduler-state.json
npx dcexport schedule daemon --jobs ./jobs.json --state ./.dcexport/scheduler-state.json
```

## Important limits

- Historic edit/delete timelines cannot be reconstructed completely from Discord REST history.
- Message content access depends on `Message Content Intent` policies.
- Signed attachment URLs may expire; exporter retries best-effort.
- Some interaction/modal payload history is only available via live recording.

## Internal architecture

- Feature-oriented modules under `src/features/*` with layered internals:
  - `domain`: core contracts and invariants
  - `application`: use-cases and orchestration
  - `infrastructure`: adapters/IO integrations
- CLI surface in `src/modules/cli/*` (typed Commander parsing + Zod validation).
- Shared primitives in `src/shared/*`:
  - `shared/utils/snowflake.ts`
  - `shared/async/concurrency.ts` (via `p-limit`)
  - `shared/json/safe-json.ts`
  - `shared/errors/*`
- Public compatibility preserved through `src/index.ts` and `src/types.ts`.

## Development

```bash
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run build
```