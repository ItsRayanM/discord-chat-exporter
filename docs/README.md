# Discord Chat Exporter Docs

This directory is the complete documentation for `@rayanmustafa/discord-chat-exporter` based on the current source code in `src/`.

## Scope

- NPM package API
- CLI commands and all flags
- Full filter system and evaluation behavior
- All render/output formats
- Output delivery modes (filesystem/Discord channel)
- Database sinks (`sqlite`, `postgres`, `mysql`, `mongodb`, `mongoose`) and custom adapters
- AI providers and analytics module
- Live recorder and merge behavior
- Ticket close integration helper
- Architecture and source file map
- Error model, limitations, and development/testing workflow

## Docs Index

- `docs/INSTALLATION.md`
- `docs/CLI.md`
- `docs/API_REFERENCE.md`
- `docs/TYPES_FULL.md`
- `docs/FILTERS.md`
- `docs/FORMATS_RENDERING.md`
- `docs/DELIVERY.md`
- `docs/DATABASES.md`
- `docs/AI_ANALYTICS.md`
- `docs/RECORDER_TICKET.md`
- `docs/ARCHITECTURE_SOURCE_MAP.md`
- `docs/ERRORS_LIMITATIONS.md`
- `docs/DEVELOPMENT_TESTING.md`
- `docs/ROADMAP.md`

## Quick Start (API)

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

## Quick Start (CLI)

```bash
npx dcexport export \
  --token "$DISCORD_BOT_TOKEN" \
  --channel 123456789012345678 \
  --formats html-single,json-full \
  --out ./exports
```
