# Delivery Targets

`output.target` controls where artifacts go after rendering.

## Modes

- `filesystem` (default)
- `discord-channel`
- `both`

## Filesystem

- Writes artifacts to `output.dir`.
- `output.dir` is required for `filesystem` and `both`.

## Discord Channel Delivery

Requires:

- `output.target` is `discord-channel` or `both`
- `output.discord.channelId`

Optional:

- `output.discord.token` (fallback is main `request.token`)
- `output.discord.content`

Behavior:

- Artifacts are uploaded using Discord REST `POST /channels/{id}/messages`
- Max 10 files per message (batched automatically)
- `allowed_mentions.parse` is empty (no mention pings)
- Returns `delivery.discord` with:
  - channel ID
  - sent message IDs
  - uploaded file count

## Temporary Output Directory Logic

If `output.dir` is omitted:

- exporter creates temp directory under OS temp path
- this is mainly useful for `discord-channel` mode
- temp directory is deleted after export unless:
  - `output.retainFiles = true`

## Validation Rules

- invalid `output.target` values fail fast
- missing `output.dir` fails for `filesystem` / `both`
- missing `output.discord.channelId` fails for Discord delivery modes

## Example

```ts
output: {
  target: "discord-channel",
  discord: {
    channelId: "987654321098765432",
    content: "Transcript generated"
  },
  retainFiles: false
}
```
