# Formats and Rendering

## Supported Output Formats

- `json-full`
- `json-clean`
- `txt`
- `md`
- `csv`
- `html-single`
- `html-bundle`
- `pdf`
- `xml`
- `sqlite`
- `docx`
- `zip`
- `analytics-json`

## Format Details

### `json-full`

- Extension: `.json`
- Complete `TranscriptDocument` serialized as-is.

### `json-clean`

- Extension: `.clean.json`
- Simplified view:
  - channel + export timestamp
  - message count
  - simplified message list

### `txt`

- Extension: `.txt`
- Readable line-based transcript with:
  - watermark/read-only/chunk headers (if enabled)
  - attachments, embed count, reaction count

### `md`

- Extension: `.md`
- Markdown transcript with summary header and optional TOC.

### `csv`

- Extension: `.csv`
- Flat tabular rows per message.

### `html-single`

- Extension: `.html`
- Self-contained HTML file with inlined app script and styles.
- Supports search (unless disabled), TOC, warnings/limitations panel, watermark, read-only banner, chunk badge.

### `html-bundle`

- Directory: `<basename>-site/`
- Artifacts:
  - `index.html`
  - `app.js`
  - `styles.css`
  - `data.json`

### `pdf`

- Extension: `.pdf`
- Generated from HTML using Playwright Chromium.
- Requires optional package `playwright`.

### `xml`

- Extension: `.xml`
- Structured XML via `fast-xml-parser`.

### `sqlite` (renderer format)

- Extension: `.sqlite`
- Local SQLite file output with tables:
  - `meta`
  - `participants`
  - `messages`
  - `attachments`
- Requires `better-sqlite3`.

### `docx`

- Extension: `.docx`
- Word document transcript.
- Requires `docx`.

### `zip`

- Extension: `.zip`
- ZIP archive containing generated artifacts and downloaded attachments.
- Optional AES-256 mode using `archiver-zip-encrypted` when configured.

### `analytics-json`

- Extension: `.analytics.json`
- Serialized analytics report output.

## Render Options

`request.render` supports:

- `timezone`
- `timestampFormat`: `12h | 24h`
- `theme`: `discord-dark-like | discord-light-like | high-contrast | minimal | compact`
- `html.mode`: `single-file | bundle | both` (currently render selection is by formats list)
- `html.searchable`
- `html.accessibilityMode`
- `watermark`
- `readOnly`
- `rtl`
- `customCss`
- `showUserIds` (reserved type field)
- `avatarSize`
- `includeTableOfContents`
- `splitPolicy.maxMessagesPerChunk`
- `splitPolicy.maxBytesPerChunk`

## Discord Markdown/Content Rendering Notes

HTML renderer includes content transforms for:

- user mention tags `<@...>`
- role mention tags `<@&...>`
- channel mention tags `<#...>`
- timestamp tags `<t:...>`
- custom emojis `<:name:id>` and `<a:name:id>`

Markdown parsing uses `markdown-it` with linkify and code block support.

## Attachments Processing

Attachment behavior is controlled via `request.attachments`:

- `include` default: `true`
- `mode`:
  - `external-link`
  - `local-download`
  - `both`
  - `base64-inline`
- `outputFolder` default: `attachments`
- `maxBase64Bytes` default: `1_500_000`
- `downloadConcurrency` default: `4`
- `retry` default: `2`

Manifest entries record status:

- `linked`
- `downloaded`
- `inlined`
- `failed`

## Split/Chunk Behavior

When `render.splitPolicy` is set:

- transcript is split by message count and/or estimated JSON bytes
- each chunk gets `transcript.meta.chunk = { index, total }`
- output basenames become:
  - single: `<basename>`
  - chunked: `<basename>.part-001`, `<basename>.part-002`, etc.

## Incremental Export State

When `output.incremental.enabled = true`:

- state file is loaded/saved with `lastMessageId`
- older/equal messages are skipped
- default state path:
  - `<outputDir>/.dcexport/state-<channelId>.json`
  - unless overridden by `output.incremental.stateFile`
