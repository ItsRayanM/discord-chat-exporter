# Database Sinks

The Database sink feature (configured under `output.database`) allows you to automatically pipe the generated JSON payloads and analytical metrics straight into your database of choice upon completion of the export.

---

## 🗄️ Built-in Drivers

To use a built-in driver, set `output.database.enabled = true` and ensure the listed optional dependency is installed via NPM.

| Driver ID      | Aliases            | Required Package |
| -------------- | ------------------ | ---------------- |
| **`sqlite`**   | -                  | `better-sqlite3` |
| **`postgres`** | `pg`, `postgresql` | `pg`             |
| **`mysql`**    | -                  | `mysql2`         |
| **`mongodb`**  | `mongo`            | `mongodb`        |
| **`mongoose`** | -                  | `mongoose`       |

---

## 📦 Shared Payload Shape

Regardless of the driver used, the engine stores a uniform, semantic JSON payload representing the entire transaction.

| Field               | Description                                              |
| ------------------- | -------------------------------------------------------- |
| `timestamp`         | Export execution time.                                   |
| `channel/guild IDs` | The IDs targeted for the export.                         |
| `formats`           | Array of formats generated.                              |
| `transcript`        | The massive, full structured conversation payload.       |
| `analyticsReport`   | The generated analytic metrics (if enabled).             |
| `aiResult`          | The summary/highlight blocks from AI (if enabled).       |
| `stats`             | General execution numbers (message counts, fetch times). |
| `metadata`          | Artifact metadata and sizes.                             |
| `requestPayload`    | The original options fed into the exporter.              |

---

## ⚙️ Driver-Specific Requirements

Configure the connection logic inside `output.database`.

### SQLite

- **driver:** `sqlite`
- **required:** `sqlitePath` (absolute or relative file path to the `.sqlite` file).
- **optional:** `table` (defaults to `exports_log`).

### PostgreSQL / MySQL

- **driver:** `postgres` OR `mysql`
- **Connection Strategy:** Provide either a unified `connectionString` (e.g., `postgres://user:pass@host/...`) **OR** separate fields (`host`, `port`, `user`, `password`, `databaseName`).
- **optional:** `table` (defaults to `exports_log`), `tls` (boolean flag).

### MongoDB / Mongoose

- **driver:** `mongodb` OR `mongoose`
- **required:** `connectionString` (e.g., `mongodb://localhost:27017/...`).
- **optional:** `databaseName`, `collection` (falls back to `table` or `exports_log`), `tls` (boolean flag).

> [!TIP]  
> Use the `options: Record<string, unknown>` field inside `output.database` to pass custom initialization parameters directly into the underlying DB client connection logic.

---

## 🛡️ Security & Validation Notes

> [!WARNING]
>
> - **Never hardcode credentials** directly in your source files. Use Environment variables (e.g., `process.env.DB_PASS`) or secret-injection systems.
> - **Verification:** For SQL namespaces, only alphanumeric/underscore identifiers are valid. For MongoDB, allowed letters include numbers, `.`, `_`, and `-`.

---

## 🧩 Building Custom Database Adapters

If the built-in drivers don't support your stack (e.g., Firebase, Supabase, Redis), you can safely inject a custom sink using the `registerDatabaseAdapter` method.

**Example: Piping into Google Firestore**

```ts
import { createExporter } from "@rayanmustafa/discord-chat-exporter";

const exporter = createExporter();

exporter.registerDatabaseAdapter({
  id: "firestore",
  async persist(ctx) {
    // Write ctx.transcript, ctx.stats, etc to your DB

    return {
      driver: "firestore",
      exportId: "abc123",
      location: "firestore.exports/abc123",
    };
  },
});
```

_(If your adapter's `id` perfectly matches the configured `driver` ID in the request, your adapter overrides the built-in system entirely)._
