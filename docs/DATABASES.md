# Database Sinks

Database sink is configured under `output.database`.

## Built-in Drivers

- `sqlite`
- `postgres` (aliases: `pg`, `postgresql`)
- `mysql`
- `mongodb` (alias: `mongo`)
- `mongoose`

If `output.database.enabled = true`, sink runs after rendering.

## Shared Payload Stored

All drivers store the same semantic payload:

- export timestamp
- channel/guild IDs
- formats
- full transcript
- analytics report (if present)
- AI result (if present)
- export stats
- artifact metadata
- original request payload

## Driver-Specific Requirements

### SQLite

- driver: `sqlite`
- required: `sqlitePath`
- optional: `table` (default `exports_log`)
- optional dependency: `better-sqlite3`

### PostgreSQL

- driver: `postgres`
- either:
  - `connectionString`
  - or host-based config (`host`, `port`, `user`, `password`, `databaseName`)
- optional: `table` (default `exports_log`)
- optional: `tls`
- optional dependency: `pg`

### MySQL

- driver: `mysql`
- either:
  - `connectionString`
  - or host-based config (`host`, `port`, `user`, `password`, `databaseName`)
- optional: `table` (default `exports_log`)
- optional: `tls`
- optional dependency: `mysql2`

### MongoDB

- driver: `mongodb`
- required: `connectionString`
- optional: `databaseName`
- optional: `collection` (fallback uses `table` then `exports_log`)
- optional: `tls`
- optional dependency: `mongodb`

### Mongoose

- driver: `mongoose`
- required: `connectionString`
- optional: `databaseName`
- optional: `collection` (fallback uses `table` then `exports_log`)
- optional: `tls`
- optional dependency: `mongoose`

## Additional Driver Options

- `options?: Record<string, unknown>`
  - merged into underlying DB client options for SQL/Mongo drivers

## Result Shape

`delivery.database` returns:

```ts
{
  driver: string;
  exportId: string | number;
  location: string;
  metadata?: Record<string, unknown>;
}
```

## Custom Database Adapters

Use `registerDatabaseAdapter` for any non-built-in database:

```ts
import { createExporter } from "@rayanmustafa/discord-chat-exporter";

const exporter = createExporter();

exporter.registerDatabaseAdapter({
  id: "firestore",
  async persist(ctx) {
    // persist ctx data to your DB
    return {
      driver: "firestore",
      exportId: "abc123",
      location: "firestore.exports/abc123",
    };
  },
});
```

If an adapter ID matches configured driver, adapter is used instead of built-in handlers.

## Security Notes

- Do not hardcode credentials in source control.
- Prefer environment variables or secret manager injection.
- For SQL table/database names, only alphanumeric/underscore identifiers are accepted.
- For Mongo collection names, allowed chars: letters, numbers, `.`, `_`, `-`.
