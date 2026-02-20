# Architecture and Source Map

## End-to-End Flow

1. Validate request (`features/export/application/validate-request.ts`)
2. Resolve output plan (`features/export/infrastructure/output-plan.ts`)
3. Collect messages/channels/threads (`modules/discord/collector.ts`)
4. Normalize raw Discord payloads (`modules/transcript/normalize.ts`)
5. Merge recorder events if configured
6. Apply incremental state cutoff
7. Apply filter DSL + predicate (`modules/transcript/filter-engine.ts`)
8. Process attachments (`modules/transcript/attachments.ts`)
9. Generate analytics (`modules/analytics` → `analytics/report.ts`)
10. Generate AI summary (`modules/ai` → `ai/providers.ts` provider selected)
11. Render requested formats (`modules/rendering` → `renderers/*.ts`)
12. Optional ZIP/PDF post-processing
13. Save incremental checkpoint
14. Deliver outputs (`modules/delivery` → Discord, DB, storage, webhooks)
15. Return `ExportResult`

## Core Concepts

- Canonical data model: `TranscriptDocument` in `src/types/` (barrel `src/types.ts`)
- Renderer plugin registry: `src/plugins/registry.ts`
- Database adapter extension point: `registerDatabaseAdapter`
- AI provider extension point: `registerAIProvider`

## Source Layout

### Entry points

- `src/index.ts`: public library exports
- `src/types.ts`: re-exports from `src/types/index.ts` (domain types)
- `src/cli.ts`: CLI entry (bin `dcexport`)

### Modules (`src/modules/`)

Feature-based modules with a single barrel per domain:

- **discord**: `discord-api.ts`, `collector.ts` — Discord REST client and message collection
- **transcript**: `normalize.ts`, `filter-engine.ts`, `attachments.ts`, `hash.ts`, `redaction.ts`, `delta.ts` — transcript building and in-memory transforms
- **rendering**: re-exports from `renderers/` (json, text, markdown, csv, xml, html, pdf, sqlite, docx, zip, analytics)
- **delivery**: re-exports from `core/` delivery (discord, database, storage, webhook)
- **analytics**: re-exports from `analytics/report.ts`
- **ai**: re-exports from `ai/providers.ts`
- **scheduler**: re-exports from `scheduler/` (store, engine, runner)
- **recorder**: re-exports from `recorder/live-recorder.ts`
- **integrations**: re-exports from `integrations/` (ticket-close, ticket-close-advanced)
- **cli**: schemas, build-request, loaders, providers (CLI parsing and request building)
- **export**: re-exports from `core/exporter.ts` (createExporter, DiscordChatExporter)

### Types (`src/types/`)

Domain types split by concern; barrel `src/types/index.ts` re-exports all. Top-level `src/types.ts` re-exports from `types/index.js` for backward-compatible imports.

- `formats.ts`, `transcript.ts`, `output.ts`, `redaction.ts`, `delta.ts`, `compliance.ts`, `monitoring.ts`, `filters.ts`, `stats.ts`, `render.ts`, `analytics.ts`, `ai.ts`, `recorder.ts`, `request.ts`, `result.ts`, `integrations.ts`
- `optional-deps.d.ts`: ambient declarations for optional dependencies

### Shared (`src/shared/`)

- `errors/`: DiscordExporterError, OptionalDependencyError, DiscordApiError, ValidationError
- `optional-require.ts`: `requireOptional()` for optional CommonJS deps
- `json/safe-json.ts`: safeJsonParse, tryJsonParse, safeJsonStringify
- `async/concurrency.ts`: createConcurrencyLimiter, runWithConcurrencyLimit
- `utils/snowflake.ts`: compareSnowflakes, getMaxSnowflakeId

### Core

- `core/exporter.ts`: orchestration pipeline (only file in core)

### Modules

- `modules/export/`: validate-request, output-plan, batch-export, monitoring; re-exports createExporter/DiscordChatExporter from core
- `modules/delivery/`: discord-delivery, database-delivery, storage-delivery, webhook-delivery
- `modules/rendering/`: format implementations (json, text, markdown, csv, xml, html, pdf, sqlite, docx, zip, analytics) and HTML infrastructure
- `modules/compliance/`: generateComplianceArtifacts (manifest + signing)
- `modules/scheduler/`: store, engine, runner
- `modules/recorder/`: live-recorder
- `modules/integrations/`: ticket-close, ticket-close-advanced
- `modules/cli/`: schemas, build-request, loaders, providers

### Other

- `src/contracts/public-types-contract.ts`: compile-time check for public type exports
- `src/plugins/registry.ts`: RendererRegistry
- `src/shared/errors/index.ts`: DiscordExporterError, ValidationError, OptionalDependencyError, DiscordApiError

## Dist Output

Compiled artifacts are emitted under `dist/` using TypeScript NodeNext config.
