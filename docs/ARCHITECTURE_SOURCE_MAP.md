# Architecture and Source Map

The `@rayanmustafa/discord-chat-exporter` library relies on a highly scalable, Domain-Driven internal structure. This safely divides the pipeline (fetching, parsing, and rendering) from the Presentation (CLI formatting, external APIs).

---

## 🏎️ End-to-End Pipeline Flow

When `exportChannel(request)` is invoked, the engine processes data linearly across the architecture:

1. **Validation** (`modules/export/application/validate-request.ts`)
2. **Output Plan Resolution** (`modules/export/infrastructure/output-plan.ts`)
3. **Data Collection** (`modules/discord/collector.ts`)
4. **Data Normalization** (`modules/transcript/normalize.ts`)
5. Merge Detached Recorder Events (if configured)
6. Apply Incremental Checkpoint Cutoffs
7. **Filter Engine & Predicates** (`modules/transcript/filter-engine.ts`)
8. **Attachment Processing** (`modules/transcript/attachments.ts`)
9. **Analytics Generation** (`modules/analytics` → `report.ts`)
10. **AI Summary Generation** (`modules/ai` → `providers.ts`)
11. **Format Rendering** (`modules/rendering` → `renderers/*.ts`)
12. ZIP / PDF Compilation processing
13. Save Incremental Checkpoints to disk
14. **Final Delivery** (`modules/delivery` → Discord, DB, Storage, Webhooks)
15. Return unified `ExportResult`

---

## 📂 Source Layout (`src/`)

### 🚪 Entry Points

| File           | Role                                                               |
| -------------- | ------------------------------------------------------------------ |
| `src/index.ts` | The primary public Node.js/TypeScript library export.              |
| `src/types.ts` | Re-exports all heavily-typed structures from `src/types/index.ts`. |
| `src/cli.ts`   | The execution binary for the `npx dcexport` Commander CLI parsing. |

### 🧩 System Modules (`src/modules/*`)

Feature-based isolation with a single exported barrel per domain.

| Module Directory   | Core Responsibility                                                             |
| ------------------ | ------------------------------------------------------------------------------- |
| **`discord`**      | Discord REST client (`discord-api.ts`) and recursive History Collection.        |
| **`transcript`**   | Engine logic for payload mapping, hashing, redaction, and delta merges.         |
| **`rendering`**    | Source files for string-building JSON, PDF, Markdown, XML, and HTML DOM arrays. |
| **`delivery`**     | Export upload handlers (Databases, Cloud Storage, Discord channel posts).       |
| **`export`**       | The master orchestration pipeline for `createExporter`.                         |
| **`analytics`**    | Statistical analysis reports mapped from message frequency.                     |
| **`ai`**           | Abstracted LLM execution and API wrappers.                                      |
| **`scheduler`**    | Schedulers, runners, and storage management for the daemon.                     |
| **`recorder`**     | Websocket NDJSON recorder interfaces.                                           |
| **`integrations`** | Pre-built interaction templates (e.g., ticket-closing).                         |
| **`cli`**          | Zod validation constraints, commander scripts, and arg payload loading.         |

### 🛠️ Shared Libraries (`src/shared/*`)

Internal tooling utilized globally across the application.

| Lib Path  | Features                                                                         |
| --------- | -------------------------------------------------------------------------------- |
| `errors/` | Custom prototypes: `DiscordExporterError`, `ValidationError`, `DiscordApiError`. |
| `async/`  | Specialized `p-limit` mechanic (`concurrency.ts`) for safe multi-threading.      |
| `json/`   | Error-bound `safeJsonParse` algorithms.                                          |
| `utils/`  | Snowflake mathematical sorters and BigInt identifiers.                           |

### 🗂️ Type Definitions (`src/types/*`)

The library emphasizes extreme strict-typing for enterprise integrity.

All operational structs (e.g., `ExportRequest`, `AnalyticsReport`, `TranscriptDocument`, `RecorderOptions`) are separated into unique scope files (`formats.ts`, `result.ts`, `ai.ts`, etc.) and seamlessly aggregated through `src/types/index.ts`.

---

## 🏭 Core Interfaces

- **Canonical Data Schema:** `TranscriptDocument` defines exactly what a recorded channel looks like.
- **Renderer Plugin Registry:** Located in `src/plugins/registry.ts`.
- **Database Architecture Extension:** Registered via `registerDatabaseAdapter()`.
- **AI Analytics Extension:** Registered via `registerAIProvider()`.

> [!NOTE]  
> All compiled artifacts publish into the base `./dist/` folder mapped strictly to standard **TypeScript NodeNext** configurations.
