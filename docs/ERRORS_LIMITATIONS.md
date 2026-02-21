# Errors and Limitations

This document outlines the bounds, exception classes, and API constraints you may encounter while using `@rayanmustafa/discord-chat-exporter`.

---

## 🛑 Error Classes

All core runtime error prototypes are defined within `src/shared/errors/index.ts` and extend standard Node.js Errors.

| Class Name                    | Description                                                                                                       |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **`DiscordExporterError`**    | The base class for all library faults. Exposes a `code` string and optional context `details`.                    |
| **`OptionalDependencyError`** | Thrown with code `OPTIONAL_DEPENDENCY_MISSING` when a feature requires an external package that isn't installed.  |
| **`DiscordApiError`**         | Thrown with code `DISCORD_API_ERROR` when the Discord REST API returns an unexpected layout or fatal HTTP status. |
| **`ValidationError`**         | Thrown with code `VALIDATION_ERROR` for malformed configuration requests.                                         |

---

## ⚠️ Common Validation Failures

Configuring a request incorrectly will instantly throw a `ValidationError`. Expect this if you trigger the following common mistakes:

- Missing critical inputs (`token` or `channelId`).
- Providing an empty or invalid `formats` array.
- Supplying an invalid `output.target` direction.
- Requesting an `output.target` of `filesystem` or `both` without defining `output.dir`.
- Requesting an `output.target` of `discord-channel` or `both` without assigning `output.discord.channelId`.
- Targeting a `sqlite` database export without defining `output.database.sqlitePath`.
- Using invalid SQL identifiers or NoSQL Collection naming formats for Database delivery.

---

## 📦 Optional Dependency Failure Cases

Certain rendering formats and Database Drivers are lazy-loaded. If you request a feature without installing its counterpart NPM package, `OptionalDependencyError` is thrown.

| Feature Requested          | Missing Dependencies Required |
| -------------------------- | ----------------------------- |
| PDF Export (`pdf`)         | `playwright`                  |
| DOCX Export (`docx`)       | `docx`                        |
| SQLite Sync (`sqlite`)     | `better-sqlite3`              |
| Postgres Sink (`postgres`) | `pg`                          |
| MySQL Sink (`mysql`)       | `mysql2`                      |
| MongoDB Sink (`mongodb`)   | `mongodb`                     |
| Mongoose Sink (`mongoose`) | `mongoose`                    |

> [!NOTE]  
> If `archiver-zip-encrypted` is missing while compiling an encrypted ZIP file, the tool gracefully falls back to a standard, non-encrypted ZIP rather than crashing.

---

## 📉 Discord & API Limitations

There are mechanical constraints originating from Discord's infrastructure that cannot be bypassed:

> [!WARNING]
>
> - **Incomplete Timelines:** Historic edit/delete states are impossible to reconstruct completely from REST endpoints alone. You **must** utilize the detached live recorder if a full audit trail is desired.
> - **Permissions Bound:** Content visibility is strictly determined by your Bot's **Message Content Intent** status.
> - **Expiring Media:** Discord signed attachment URLs may automatically expire over time.
> - **Interactive Data:** Some interaction/modal history payloads decay and cannot be recovered via API history pagination.

---

## ✅ Export Integrity Signals

Every export result returns a `limitations` and `warnings` array to clarify anomalies rather than failing silently.

| Field              | Purpose                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `warnings[]`       | Arrays of string notes documenting non-fatal runtime anomalies (e.g., failed to download one specific attachment). |
| `limitations[]`    | Documented capability thresholds reached during the run.                                                           |
| `files[].checksum` | Included SHA-256 signatures for every artifact generated to verify integrity.                                      |

### Reliability Notes

- The internal REST client **automatically retries** `429` (Rate limits) and `5xx` gateway errors through an exponential backoff engine.
- The Collector permanently deduplicates messages by `message_id` and sorts rigidly by the internal Snowflake chronological date.
