# Installation

## Requirements

- Node.js `>=20`
- Bot token with Discord permissions to read target channels/threads

## Package Install

```bash
npm i @rayanmustafa/discord-chat-exporter
```

## Optional Dependencies by Feature

```bash
npm i playwright better-sqlite3 docx archiver-zip-encrypted pg mysql2 mongodb mongoose
```

### Optional Package Matrix

- `playwright`: required for `pdf` renderer
- `better-sqlite3`: required for `sqlite` renderer and SQLite DB sink
- `docx`: required for `docx` renderer
- `archiver-zip-encrypted`: enables AES-256 ZIP encryption mode
- `pg`: required for PostgreSQL DB sink
- `mysql2`: required for MySQL DB sink
- `mongodb`: required for MongoDB DB sink
- `mongoose`: required for Mongoose DB sink
- `shiki`: listed as optional dependency in package metadata (not used directly by current built-in renderers)

## Environment Variables

### Export/Auth

- `DISCORD_BOT_TOKEN`: your bot token (CLI examples use it)

### AI Provider Auto-Registration

Auto registration is implemented in exporter + CLI for popular providers:

- OpenAI:
  - `OPENAI_API_KEY`
- Gemini:
  - `GEMINI_API_KEY` or `GOOGLE_API_KEY`
  - optional `GEMINI_MODEL`
- Anthropic:
  - `ANTHROPIC_API_KEY`
  - optional `ANTHROPIC_MODEL`
- OpenAI-compatible (CLI helper):
  - `OPENAI_COMPATIBLE_API_KEY`
  - optional `OPENAI_COMPATIBLE_BASE_URL`
  - optional `OPENAI_COMPATIBLE_MODEL`
  - optional `OPENAI_COMPATIBLE_PROVIDER_ID`

## Build / Dev Commands

- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run dev`
- `npm run clean`
