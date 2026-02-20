# Chat Exporter – Architecture & Restructuring Plan

This document describes the modular architecture, folder hierarchy, module boundaries, and integration points for the Discord chat exporter codebase.

---

## 1. Folder Hierarchy

```
src/
├── core/                      # Application orchestration (single entry point)
│   └── exporter.ts            # DiscordChatExporter class; coordinates modules
├── types/                     # Global type definitions (single source of truth)
│   ├── index.ts               # Barrel: re-exports all domain types
│   ├── request.ts
│   ├── result.ts
│   ├── transcript.ts
│   ├── output.ts
│   ├── formats.ts
│   ├── filters.ts
│   ├── render.ts
│   ├── analytics.ts
│   ├── ai.ts
│   ├── recorder.ts
│   ├── redaction.ts
│   ├── delta.ts
│   ├── compliance.ts
│   ├── monitoring.ts
│   ├── stats.ts
│   ├── integrations.ts
│   └── optional-deps.d.ts
├── types.ts                   # Public re-export of types (for package consumers)
├── shared/                     # Cross-cutting utilities and primitives
│   ├── errors/
│   │   └── index.ts
│   ├── async/
│   │   └── concurrency.ts
│   ├── utils/
│   │   └── snowflake.ts
│   ├── json/
│   │   └── safe-json.ts
│   ├── optional-require.ts
│   └── constants.ts
├── plugins/                   # (Legacy) Renderer registry – prefer modules/rendering
│   └── registry.ts            # → moved to modules/rendering/registry.ts
└── modules/                   # Feature modules (by domain)
    ├── discord/               # Discord API & message collection
    │   ├── index.ts
    │   ├── discord-api.ts     # API client (when present)
    │   └── collector.ts       # collectMessages (when present)
    ├── transcript/            # Transcript building, filtering, hashing, delta, redaction
    │   ├── index.ts
    │   ├── hash.ts
    │   ├── normalize.ts       # buildTranscript (when present)
    │   ├── filter-engine.ts
    │   ├── attachments.ts
    │   ├── redaction.ts
    │   └── delta.ts
    ├── rendering/             # All output formats & renderer registry
    │   ├── index.ts
    │   ├── types.ts           # writeArtifact, internal helpers
    │   ├── registry.ts        # RendererRegistry (moved from plugins/)
    │   ├── json.ts, text.ts, markdown.ts, csv.ts, xml.ts
    │   ├── html.ts, pdf.ts, sqlite.ts, docx.ts, zip.ts, analytics.ts
    │   └── infrastructure/
    │       └── html/           # HTML-specific: templates, styles, view-data
    ├── export/                # Export use-case: validation, batch, monitoring, output plan
    │   ├── index.ts
    │   ├── batch-export.ts
    │   ├── monitoring.ts
    │   ├── application/
    │   │   ├── validate-request.ts
    │   │   ├── incremental-state.ts   # load/save incremental state (extracted)
    │   │   └── recorder-merge.ts      # mergeRecorderEvents (extracted)
    │   └── infrastructure/
    │       └── output-plan.ts
    ├── delivery/              # Delivery targets: Discord, DB, storage, webhooks
    │   ├── index.ts
    │   ├── discord-delivery.ts
    │   ├── database-delivery.ts
    │   ├── storage-delivery.ts
    │   └── webhook-delivery.ts
    ├── analytics/             # Analytics report generation
    │   ├── index.ts
    │   └── report.ts
    ├── ai/                    # AI providers (heuristic, OpenAI, Gemini, Claude)
    │   ├── index.ts
    │   └── providers.ts
    ├── compliance/            # Manifest & signing
    │   └── index.ts
    ├── recorder/              # Live event recorder
    │   ├── index.ts
    │   └── live-recorder.ts
    ├── scheduler/             # Cron-based batch scheduler
    │   ├── index.ts
    │   ├── engine.ts
    │   ├── store.ts
    │   └── runner.ts
    ├── integrations/          # Ticket-close handlers (Discord bot use cases)
    │   ├── index.ts
    │   ├── ticket-close.ts
    │   └── ticket-close-advanced.ts
    └── cli/                   # CLI parsing, request building, loaders
        ├── index.ts
        ├── schemas.ts
        ├── build-request.ts
        ├── loaders.ts
        └── providers.ts
```

---

## 2. Module Boundaries & Responsibilities

| Module        | Responsibility | Depends On |
|---------------|----------------|------------|
| **core**      | Single orchestrator: validate → collect → transcript → filter → redact → attach → analytics/AI → render → compliance → deliver. No business logic; only flow and wiring. | types, discord, transcript, rendering, export (validation, batch, monitoring, output-plan), delivery, analytics, ai, compliance, recorder, shared |
| **types**     | All public interfaces and type aliases. No runtime code. | — |
| **shared**    | Errors, concurrency, snowflake utils, safe JSON, optional require, constants. | — |
| **discord**   | Discord API client and message/thread collection. | types |
| **transcript**| Build transcript, apply filters, process attachments, hash, redaction, delta. | types, shared |
| **rendering** | Format-specific renderers + registry. Each renderer: `RenderContext → Promise<RenderArtifact[]>`. | types, transcript (hash) |
| **export**    | Request validation, output plan resolution, batch export orchestration, monitoring events, incremental state, recorder event merge. | types, shared, transcript |
| **delivery**  | Send artifacts to Discord channel, DB, storage, webhooks. | types, shared |
| **analytics** | Generate analytics report from transcript. | types |
| **ai**        | AI provider interface and implementations (heuristic, OpenAI, Gemini, Claude). | types |
| **compliance**| Generate manifest and optional signature. | types, shared, transcript |
| **recorder**  | Live event recording to file. | types |
| **scheduler** | Cron engine, job store, runner. | types, shared, core (createExporter) |
| **integrations** | Ticket-close and advanced ticket-close handlers. | types, core |
| **cli**       | Parse CLI options, build export request, load jobs/filters. | types, shared, scheduler |

---

## 3. Integration Points

- **Entry (library):** `src/index.ts` (or equivalent) exports `createExporter`, `DiscordChatExporter`, and public types from `@/types`.
- **Entry (CLI):** `src/cli.ts` uses `modules/cli` to parse options and build requests, then `core/exporter` to run export/batch/recorder.
- **Core → modules:** Core imports only from `@/types`, `@/modules/<name>/index.js`, and `@/shared`. It does not import from deep paths (e.g. `@/modules/export/application/validate-request.js`) except where the module’s index does not re-export (acceptable for application/infrastructure subfolders).
- **Cross-module:** Prefer dependency in one direction (e.g. delivery does not depend on analytics). Shared types live in `types/`; shared behavior in `shared/`.

---

## 4. Design Principles

- **Single responsibility:** Each module has one clear purpose.
- **Explicit boundaries:** Modules expose a small surface via `index.ts`; internal structure can use `application/` and `infrastructure/` where it helps.
- **Types as contract:** All cross-boundary data is typed via `src/types`. No ad-hoc inline types at module boundaries.
- **Testability:** Domain logic (validation, filters, redaction, analytics, incremental state, recorder merge) is in pure or injectable functions so unit tests need no Discord or file I/O where possible.
- **Scalability:** New formats = new renderer + registry; new delivery target = new delivery module; new AI provider = new provider implementation.

---

## 5. Restructuring Checklist (Applied)

- [x] Types: single source in `types/`, re-exported from `types/index.ts` and root `types.ts`.
- [x] Shared: add `shared/json/safe-json.ts`, `shared/optional-require.ts`, `shared/constants.ts`.
- [x] Rendering: move `plugins/registry.ts` → `modules/rendering/registry.ts`; update all imports to use `@/modules/rendering`.
- [x] Export: extract incremental state and recorder merge into `export/application/` and use them from core.
- [x] Core: keep orchestrator thin; use constants for version and magic strings.
- [x] Tooling: align Vitest with tsconfig paths so tests resolve `@/*` consistently.

---

## 6. Implementation Notes

- **Missing modules:** The codebase imports from `@/modules/discord/discord-api.js`, `@/modules/discord/collector.js`, and from `@/modules/transcript/normalize.js`, `filter-engine.js`, `attachments.js`, `redaction.js`, `delta.js`. If those files are not present, add them under the paths shown in the folder hierarchy so that the project builds.
- **Root entry:** `src/index.ts` re-exports the public API (createExporter, validation, batch, monitoring, types). The CLI entry is `src/cli.ts` (if present).

## 7. Naming & Conventions

- **Files:** `kebab-case.ts` for multi-word names; `camelCase` only for single-word or established names (e.g. `types.ts`).
- **Exports:** Prefer named exports; default export only for a single main class (e.g. `DiscordChatExporter` can be default if desired; currently named).
- **Imports:** Use `@/` path alias for `src/`. Use `.js` extension in specifiers for ESM.
- **Types:** Use `type` for type-only imports. Prefer `interface` for object shapes; use `type` for unions and aliases.
