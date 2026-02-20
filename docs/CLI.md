# CLI Reference

Binary name: `dcexport`

## Commands

- `dcexport export`
- `dcexport record start`
- `dcexport record stop`
- `dcexport record run` (internal foreground recorder)
- `dcexport plugins list`
- `dcexport plugins verify`
- `dcexport doctor`

## `dcexport export`

### Required

- `--token <token>`
- `--channel <channelId>`

### General Input

- `--guild <guildId>`
- `--threads <threadIds>` comma-separated
- `--formats <formats>` default: `html-single,json-full`
- `--basename <name>`
- `--filter-file <path>` (JSON containing `FilterGroup`)

### Output Target / Delivery

- `--out <dir>`
- `--output-target <target>` values: `filesystem | discord-channel | both` default: `filesystem`
- `--retain-files` keep generated files when exporter uses temporary directory
- `--discord-output-channel <channelId>`
- `--discord-output-token <token>` optional override for delivery
- `--discord-output-content <text>`

### Database Sink

- `--db-driver <id>` values include `sqlite|postgres|mysql|mongodb|mongoose|custom`
- `--db-connection <uri>`
- `--db-host <host>`
- `--db-port <port>`
- `--db-user <username>`
- `--db-password <password>`
- `--db-name <name>`
- `--db-collection <name>`
- `--db-tls`
- `--db-sqlite <path>`
- `--db-table <name>` default: `exports_log`

### Attachments

- `--attachments-mode <mode>` values: `external-link|local-download|both|base64-inline` default: `external-link`
- `--download-concurrency <n>` default: `4`
- `--max-base64-bytes <n>` default: `1500000`

### Render / Theme / UX

- `--zip-password <password>` enables ZIP AES-256 path
- `--theme <theme>` values: `discord-dark-like|discord-light-like|high-contrast|minimal|compact`
- `--timezone <tz>` default: `UTC`
- `--timestamp-format <format>` values: `12h|24h` default: `24h`
- `--watermark <text>`
- `--read-only`
- `--rtl`
- `--toc`
- `--html-accessibility`
- `--no-html-searchable`

### Split / Incremental

- `--split-max-messages <n>`
- `--split-max-bytes <n>`
- `--incremental`
- `--incremental-state <path>`

### Analytics / AI

- `--analytics`
- `--analytics-heatmap`
- `--top-words <n>` default: `100`
- `--top-mentions <n>` default: `25`
- `--ai`
- `--ai-provider <id>` default: `heuristic`
- `--ai-prompt <text>`
- `--ai-max-highlights <n>` default: `8`

## `dcexport record start`

Starts a detached process.

- required: `--token <token>`, `--out <file>`
- optional: `--guilds <ids>`, `--channels <ids>`
- optional: `--session-file <path>` default: `./.dcexport/recorder-session.json`

## `dcexport record stop`

- optional: `--session-file <path>` default: `./.dcexport/recorder-session.json`

## `dcexport record run`

Foreground/internal variant used by `record start`.

- required: `--token <token>`, `--out <file>`
- optional: `--guilds <ids>`, `--channels <ids>`

## `dcexport plugins list`

Prints built-in format list.

## `dcexport plugins verify`

Prints current plugin verification message for CLI context.

## `dcexport doctor`

Checks bot identity, channel visibility, and a sample message fetch.

- required: `--token <token>`, `--channel <channelId>`

## Practical Examples

### Filesystem export

```bash
npx dcexport export \
  --token "$DISCORD_BOT_TOKEN" \
  --channel 123456789012345678 \
  --formats html-single,json-full \
  --out ./exports
```

### Discord-channel delivery only (temp output dir auto-managed)

```bash
npx dcexport export \
  --token "$DISCORD_BOT_TOKEN" \
  --channel 123456789012345678 \
  --formats html-single,json-full \
  --output-target discord-channel \
  --discord-output-channel 987654321098765432
```

### PostgreSQL sink

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
