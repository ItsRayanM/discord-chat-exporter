# Errors and Limitations

## Error Classes

Defined in `src/shared/errors/index.ts`.

- `DiscordExporterError`
  - base class
  - includes `code` and optional `details`
- `OptionalDependencyError`
  - code: `OPTIONAL_DEPENDENCY_MISSING`
  - thrown when optional package required by selected feature is missing
- `DiscordApiError`
  - code: `DISCORD_API_ERROR`
  - includes HTTP status and response details
- `ValidationError`
  - code: `VALIDATION_ERROR`
  - thrown for invalid requests/config

## Common Validation Failures

- missing `token`
- missing `channelId`
- no `formats`
- invalid `output.target`
- missing `output.dir` when target is filesystem/both
- missing `output.discord.channelId` when target includes Discord delivery
- sqlite driver selected without `output.database.sqlitePath`
- invalid SQL identifiers (`table`, SQL `databaseName`) format
- invalid Mongo collection name format

## Optional Dependency Failure Cases

- `playwright` missing with `pdf` format
- `docx` missing with `docx` format
- `better-sqlite3` missing with `sqlite` format or sqlite DB sink
- `pg` missing with postgres DB sink
- `mysql2` missing with mysql DB sink
- `mongodb` missing with mongodb sink
- `mongoose` missing with mongoose sink
- `archiver-zip-encrypted` missing while ZIP encryption requested:
  - ZIP still falls back to normal ZIP mode

## Discord/API Limitations

- historic edit/delete timelines are incomplete from REST alone
- content visibility depends on Message Content intent policies
- signed attachment URLs can expire
- some interaction/modal history cannot be reconstructed from history alone
- recorder captures events only from the moment it starts

## Export Integrity Signals

- `warnings[]`: non-fatal issues encountered
- `limitations[]`: capability/API constraints affecting completeness
- `files[]`: includes checksum SHA-256 for artifact integrity

## Reliability Notes

- REST client retries for 429/5xx with backoff
- collector deduplicates by message ID and sorts by snowflake
- exporter avoids silent failures by surfacing warnings/limitations
