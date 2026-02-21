<div align="center">

# @rayanmustafa/discord-chat-exporter - Complete Documentation

**High-fidelity Discord transcript exporter for bot-based workflows.**

</div>

Welcome to the **Complete Documentation Index** for `@rayanmustafa/discord-chat-exporter`. This directory contains detailed, modular guides explaining every aspect of the library based on the current source code in the `src/` directory.

---

## 📑 Documentation Index

Explore the detailed topic guides below:

### Getting Started

- 🚀 [Installation Guide](INSTALLATION.md) — Dependencies, system requirements, and setup instructions.
- 💻 [CLI Reference](CLI.md) — Command-line interface usage, flags, and scripting examples.
- 🛠 [API Reference](API_REFERENCE.md) — Implementation guides for TypeScript & Node.js integrations.

### Core Systems & Processing

- 🎨 [Formats & Rendering](FORMATS_RENDERING.md) — Explore supported outputs (HTML, JSON, PDF, ZIP, etc.) and rendering options.
- 🔍 [Filtering Engine](FILTERS.md) — Advanced filtering system including content, state, time, and user logic.
- 🚚 [Delivery Options](DELIVERY.md) — Output deployment to Local FS, Cloud (S3/Azure), and Webhooks.
- 🗄️ [Databases](DATABASES.md) — Sinking transcripts directly into SQLite, Postgres, MongoDB, or Custom Databases.

### Advanced Capabilities

- 🤖 [AI & Analytics](AI_ANALYTICS.md) — Intelligent summarization plugins, heatmap generation, and integrating OpenAI/Gemini/Anthropic.
- 🔴 [Live Recorder & Tickets](RECORDER_TICKET.md) — Live NDJSON recording, event merging, and Discord ticket close helpers.

### Architecture & Development

- 🏗 [Architecture & Source Map](ARCHITECTURE_SOURCE_MAP.md) — Deep dive into the `src/` modular architecture and data pipelines.
- ⚠️ [Errors & Limitations](ERRORS_LIMITATIONS.md) — Known bounds, exception handling, and API constraints.
- 🧪 [Development & Testing](DEVELOPMENT_TESTING.md) — Contributing guidelines and testing workflows.
- 🗺️ [Roadmap](ROADMAP.md) — Future goals and planned enhancements.
- 🧩 [Full Type Definitions](TYPES_FULL.md) — Complete TypeScript interface declarations.

---

## ⚡ Quick Start: TypeScript API

```ts
import { createExporter } from "@rayanmustafa/discord-chat-exporter";

const exporter = createExporter();

const result = await exporter.exportChannel({
  token: process.env.DISCORD_BOT_TOKEN!,
  channelId: "123456789012345678",
  formats: ["html-single", "json-full"],
  output: {
    dir: "./exports",
  },
});

console.log(result.files, result.stats, result.warnings, result.limitations);
```

## ⚡ Quick Start: CLI

```bash
npx dcexport export \
  --token "$DISCORD_BOT_TOKEN" \
  --channel 123456789012345678 \
  --formats html-single,json-full \
  --out ./exports
```
