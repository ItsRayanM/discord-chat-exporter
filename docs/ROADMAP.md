# Roadmap Snapshot

This mirrors `plam.md` and reflects currently implemented status.

## Implemented from Future Plan

- XML / SQLite / DOCX outputs
- ZIP encryption support (AES-256 plugin path)
- Watermark support
- Read-only rendering mode
- Split/chunk export policy
- Incremental export checkpoints
- Analytics module (`analytics-json`)
- AI summary/highlights plugin API
- Built-in heuristic AI provider
- OpenAI-compatible provider adapter
- Google Gemini provider
- Anthropic Claude provider
- OpenAI provider
- HTML table of contents
- HTML accessibility mode
- Delivery targets (`filesystem`, `discord-channel`, `both`)
- Multi-database sinks (`sqlite`, `postgres`, `mysql`, `mongodb`, `mongoose`)
- Custom DB adapters via `registerDatabaseAdapter`

## Ongoing Constraints

- Discord API intent/content limitations
- incomplete historical edit/delete reconstruction from REST-only history
- signed attachment URL expiration behavior
