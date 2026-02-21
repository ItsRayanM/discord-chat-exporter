# Formats and Rendering

This section describes every export format mathematically parsed by `@rayanmustafa/discord-chat-exporter` alongside the UI UX features you can trigger for visual artifacts (like HTML).

---

## 🎨 Supported Formats Overview

| Format ID        | Extension         | Output Style | Description                                                                   |
| ---------------- | ----------------- | ------------ | ----------------------------------------------------------------------------- |
| `json-full`      | `.json`           | Raw Data     | Complete `TranscriptDocument` object preserved exactly as extracted.          |
| `json-clean`     | `.clean.json`     | Raw Data     | Stripped-down version focusing purely on message text and user IDs.           |
| `txt`            | `.txt`            | Document     | Readable line-based transcript (includes attachments/reaction tallies).       |
| `md`             | `.md`             | Document     | Standard Markdown transcript with headers and a Table of Contents.            |
| `csv`            | `.csv`            | Document     | Flat tables with single rows per message parsed.                              |
| `xml`            | `.xml`            | Document     | Structured hierarchical XML via `fast-xml-parser`.                            |
| `html-single`    | `.html`           | UI View      | Self-contained, zero-dependency HTML file modeling the Discord app.           |
| `html-bundle`    | `-site/`          | UI View      | A folder output (`index.html`, `app.js`, `styles.css`) for deployment.        |
| `pdf`            | `.pdf`            | UI View      | High-fidelity PDF snapshot of the HTML view. Requires `playwright`.           |
| `sqlite`         | `.sqlite`         | Database     | Dumps into a local SQLite file instantly. Requires `better-sqlite3`.          |
| `docx`           | `.docx`           | Document     | MS Word formatted document. Requires `docx`.                                  |
| `zip`            | `.zip`            | Archive      | Bundles formats + media files. AES-256 enabled with `archiver-zip-encrypted`. |
| `analytics-json` | `.analytics.json` | Raw Data     | Standalone file containing metrics and AI heatmaps.                           |

---

## 🖥️ HTML Rendering Details

The HTML Views (`html-single` & `html-bundle`) are built to closely mimic the actual Discord Client visually.

### Discord Layout Control

If the channel belongs to a guild, the exporter fetches the full guild and channel index, generating a **Full Discord UI**.
You can control this layout via `render.html.panels` in the API, or via CLI flags:

| Panel Focus      | CLI Flag to Hide         | Description                                       |
| ---------------- | ------------------------ | ------------------------------------------------- |
| **Server List**  | `--html-no-server-list`  | Hides the far-left server icon column.            |
| **Channel List** | `--html-no-channel-list` | Hides the list of channels and categories.        |
| **Members List** | `--html-no-members`      | Hides the active participants panel on the right. |

### Visual Settings & Themes

Configure output aesthetics using `request.render`:

| Option                   | Values / Types                                                                             | Description                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `theme`                  | `discord-dark-like` (default), `discord-light-like`, `high-contrast`, `minimal`, `compact` | Swaps the CSS injection palette.                                    |
| `timezone`               | e.g. `UTC`, `America/New_York`                                                             | Sets native times rendering.                                        |
| `timestampFormat`        | `12h`, `24h`                                                                               | Sets clock rendering format.                                        |
| `watermark`              | `string`                                                                                   | Applies a diagonal text watermark overlay across HTML exports.      |
| `readOnly`               | `boolean`                                                                                  | Locks interaction visuals like chatboxes.                           |
| `rtl`                    | `boolean`                                                                                  | Flips standard Right-to-Left writing layout.                        |
| `html.searchable`        | `boolean`                                                                                  | Embeds a lightweight client-side search indexing system.            |
| `html.accessibilityMode` | `boolean`                                                                                  | Upgrades contrast ratios and injects ARIA roles for screen readers. |

> [!NOTE]  
> The internal HTML rendering engine parses all native Discord markdown tags into actual DOM nodes. This includes mentions (`<@id>`), roles (`<@&id>`), channels (`<#id>`), timestamps (`<t:time>`), and Custom Emotes (`<:name:id>`).

---

## 📎 Attachments Processing

Control how external media is mapped in your artifacts by supplying `request.attachments.mode`:

| Mode                        | Behavior                                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `external-link` _(default)_ | Media points directly to Discord CDN URLs. (Will break if Discord invalidates the URL).                                         |
| `local-download`            | Engine automatically pulls the file into `./attachments/` and updates HTML paths to point locally.                              |
| `both`                      | Combination of the two. Maintains a local copy but references the CDN as a fallback.                                            |
| `base64-inline`             | Downloads the file and converts smaller items directly into Base64 URI strings embedded natively into the database/HTML string. |

**Advanced Attachment Limits:**

- `maxBase64Bytes` (default: 1.5MB) controls what files are skipped during inline processing.
- `downloadConcurrency` (default: 4) limits parallel network connections hitting Discord CDN.

---

## ✂️ Split & Chunking Policies

To prevent massive servers from generating Multi-Gigabyte JSON or un-openable HTML pages, you can apply rules in `render.splitPolicy`:

- `maxMessagesPerChunk` (Count)
- `maxBytesPerChunk` (Size constraint)

When a limit is breached, exports generate suffix variants (e.g., `<basename>.part-001.html`).

## 🛑 Incremental Checkpoints (Delta mode)

By setting `output.incremental.enabled = true`, the export avoids redownloading massive history:

1. Exporter checks `./.dcexport/state-<channelId>.json` for the last processed `lastMessageId`.
2. Engine skips all messages older than the checkpoint ID.
3. Automatically writes a new checkpoint signature once finished.
