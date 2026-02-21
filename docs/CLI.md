# CLI Reference

The binary command for the CLI is `dcexport`.

This document serves as the definitive guide to all available commands and flags for `@rayanmustafa/discord-chat-exporter`.

---

## 🛠 Commands Overview

| Command                   | Description                                                         |
| ------------------------- | ------------------------------------------------------------------- |
| `dcexport export`         | Main command to export channel data and generate formats.           |
| `dcexport record start`   | Starts a detached background process to record live channel events. |
| `dcexport record stop`    | Stops the detached recorder process.                                |
| `dcexport record run`     | Internal foreground recorder (typically invoked by `start`).        |
| `dcexport plugins list`   | Prints the built-in format list.                                    |
| `dcexport plugins verify` | Verifies and prints plugin status for the CLI context.              |
| `dcexport doctor`         | Checks bot identity, channel visibility, and performs a test fetch. |

---

## 🚀 `dcexport export`

The `export` command is the core utility of this tool. Below are the available flags grouped by their functionality.

### 🔑 Required Flags

| Flag                    | Description                    |
| ----------------------- | ------------------------------ |
| `--token <token>`       | Your Discord Bot Token.        |
| `--channel <channelId>` | The Target Discord Channel ID. |

### ⚙️ General Configuration

| Flag                    | Description                                                | Default                 |
| ----------------------- | ---------------------------------------------------------- | ----------------------- |
| `--guild <guildId>`     | Restrict fetch to a specific Guild ID.                     | `undefined`             |
| `--threads <threadIds>` | Comma-separated list of Thread IDs to include.             | `undefined`             |
| `--formats <formats>`   | Comma-separated list of desired output formats.            | `html-single,json-full` |
| `--basename <name>`     | Base name for the generated files (e.g., `ticket-1234`).   | `undefined`             |
| `--filter-file <path>`  | Path to a JSON file containing a `FilterGroup` definition. | `undefined`             |

### 📦 Output Target / Delivery Mode

| Flag                                   | Description                                                                                        | Default      |
| -------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------ |
| `--out <dir>`                          | Directory to store local exports.                                                                  | `./out`      |
| `--output-target <target>`             | Delivery mode (`filesystem`, `discord-channel`, `both`).                                           | `filesystem` |
| `--retain-files`                       | Keep generated files even if the exporter uses a temporary directory (e.g., for Discord delivery). | `false`      |
| `--discord-output-channel <channelId>` | Channel ID where the generated files should be uploaded.                                           | `undefined`  |
| `--discord-output-token <token>`       | Optional override token specifically for delivery.                                                 | Base Token   |
| `--discord-output-content <text>`      | Text to attach with the Discord file upload.                                                       | `undefined`  |

### 🗄️ Database Sinks

Use these flags to pipe exported metrics or complete JSON payloads into a Database.

| Flag                       | Description                                                                       |
| -------------------------- | --------------------------------------------------------------------------------- |
| `--db-driver <id>`         | Target database (`sqlite`, `postgres`, `mysql`, `mongodb`, `mongoose`, `custom`). |
| `--db-connection <uri>`    | Full connection string URI.                                                       |
| `--db-host <host>`         | Database Host IP or Domain.                                                       |
| `--db-port <port>`         | Database Port.                                                                    |
| `--db-user <username>`     | Database Username.                                                                |
| `--db-password <password>` | Database Password.                                                                |
| `--db-name <name>`         | Database Name.                                                                    |
| `--db-collection <name>`   | Collection Name (NoSQL like MongoDB).                                             |
| `--db-table <name>`        | Table Name (SQL). Default is `exports_log`.                                       |
| `--db-tls`                 | Enable TLS for the database connection.                                           |
| `--db-sqlite <path>`       | Direct path for the SQLite database file.                                         |

### 📎 Attachments Management

| Flag                         | Description                                                            | Default         |
| ---------------------------- | ---------------------------------------------------------------------- | --------------- |
| `--attachments-mode <mode>`  | Strategy (`external-link`, `local-download`, `both`, `base64-inline`). | `external-link` |
| `--download-concurrency <n>` | Max concurrent parallel attachment downloads.                          | `4`             |
| `--max-base64-bytes <n>`     | Maximum file size (in bytes) to inline as Base64.                      | `1500000`       |

### 🎨 Render / Theme / UX Controls

| Flag                          | Description                                                                                  | Default             |
| ----------------------------- | -------------------------------------------------------------------------------------------- | ------------------- |
| `--theme <theme>`             | UI Theme (`discord-dark-like`, `discord-light-like`, `high-contrast`, `minimal`, `compact`). | `discord-dark-like` |
| `--zip-password <password>`   | Enables AES-256 encryption on ZIP outputs.                                                   | `undefined`         |
| `--timezone <tz>`             | Render times natively in a specific timezone (e.g., Africa/Cairo).                           | `UTC`               |
| `--timestamp-format <format>` | Set clock representation (`12h` or `24h`).                                                   | `24h`               |
| `--watermark <text>`          | Prints a diagonal text watermark across HTML exports.                                        | `undefined`         |
| `--read-only`                 | Locks input fields visually in HTML views.                                                   | `false`             |
| `--rtl`                       | Forces Right-To-Left text rendering.                                                         | `false`             |
| `--toc`                       | Generates a Table of Contents side-menu navigation.                                          | `false`             |
| `--html-accessibility`        | Adds ARIA roles and contrast fixes for screen readers.                                       | `false`             |
| `--no-html-searchable`        | Excludes the HTML Search bar indexing map.                                                   | `false`             |
| `--html-no-server-list`       | Hides the server icons list on the far left.                                                 | `false`             |
| `--html-no-channel-list`      | Hides the channels sidebar in the UI.                                                        | `false`             |
| `--html-no-members`           | Hides the Members sidebar on the right side.                                                 | `false`             |

### 🔪 Split & Incremental Behavior

| Flag                         | Description                                              |
| ---------------------------- | -------------------------------------------------------- |
| `--split-max-messages <n>`   | Split export file sizes if channel exceeds `n` messages. |
| `--split-max-bytes <n>`      | Split export file sizes if chunk exceeds `n` bytes.      |
| `--incremental`              | Activates Checkpoint-based syncs instead of full pulls.  |
| `--incremental-state <path>` | State definition file path for `--incremental`.          |

### 🧠 Analytics & AI Integration

| Flag                      | Description                                                     | Default     |
| ------------------------- | --------------------------------------------------------------- | ----------- |
| `--analytics`             | Generates a metric analysis payload of the export.              | `false`     |
| `--analytics-heatmap`     | Generates visual activity heatmaps based on time.               | `false`     |
| `--top-words <n>`         | Extract the top `n` most frequently used words.                 | `100`       |
| `--top-mentions <n>`      | Rank the top `n` most active users/mentions.                    | `25`        |
| `--ai`                    | Triggers the AI pipeline parsing.                               | `false`     |
| `--ai-provider <id>`      | Select AI logic (`heuristic`, `openai`, `gemini`, `anthropic`). | `heuristic` |
| `--ai-prompt <text>`      | Overrides the default system prompt fed to the model.           | `undefined` |
| `--ai-max-highlights <n>` | Return exactly `n` bullet points of highlights.                 | `8`         |

---

## ⏺️ Live Recorders

### `dcexport record start`

Starts a detached background process to listen to live websocket `MESSAGE_CREATE`/`DELETE`/`UPDATE`/`REACTION` events.

> [!NOTE]
>
> - **Required**: `--token <token>`, `--out <file.ndjson>`
> - **Optional**: `--guilds <ids>`, `--channels <ids>`
> - **Session config**: `--session-file <path>` _(Default: `./.dcexport/recorder-session.json`)_

### `dcexport record stop`

Kills the detached process linked to the session file.

> [!NOTE]
>
> - **Optional**: `--session-file <path>` _(Default: `./.dcexport/recorder-session.json`)_

---

## 🩺 System Verification

### `dcexport doctor`

Checks bot identity, API health, channel visibility (`VIEW_CHANNEL` permissions), and verifies access to `Message Content Intent` limits via a sample fetch.

> [!NOTE]
>
> - **Required**: `--token <token>`, `--channel <channelId>`

---

## 💡 Practical Examples

### Standard Filesystem Export

```bash
npx dcexport export \
  --token "$DISCORD_BOT_TOKEN" \
  --channel 123456789012345678 \
  --formats html-single,json-full \
  --out ./exports
```

### Serverless Execution (Discord-Channel Delivery Only)

(Auto-deletes the temporary data once the upload is complete)

```bash
npx dcexport export \
  --token "$DISCORD_BOT_TOKEN" \
  --channel 123456789012345678 \
  --formats html-single,json-full \
  --output-target discord-channel \
  --discord-output-channel 987654321098765432
```

### High-Volume Database Sink

(Dumps the structured payload directly to a Postgres server)

```bash
npx dcexport export \
  --token "$DISCORD_BOT_TOKEN" \
  --channel 123456789012345678 \
  --formats json-full \
  --db-driver postgres \
  --db-connection "postgres://user:pass@localhost:5432/transcripts" \
  --db-table exports_log \
  --out ./exports
```
