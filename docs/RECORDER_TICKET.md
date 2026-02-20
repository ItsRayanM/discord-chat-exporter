# Recorder and Ticket Integration

## Live Recorder

Recorder is built on `discord.js` and writes NDJSON events.

Entry points:

- API: `startLiveRecorder(options)`
- CLI:
  - `dcexport record start`
  - `dcexport record stop`
  - `dcexport record run`

## Recorder Options

```ts
interface RecorderStartOptions {
  token: string;
  outFile: string;
  guildIds?: string[];
  channelIds?: string[];
}
```

Events are filtered by optional guild/channel allow-lists.

## Gateway Intents Used

- `Guilds`
- `GuildMessages`
- `MessageContent`
- `GuildMessageReactions`

Partials:

- Channel, Message, Reaction, User

## Event Kinds Written

- `message_create`
- `message_update`
- `message_delete`
- `reaction_add`
- `reaction_remove`

Each line is a serialized `TranscriptEvent` JSON object.

## Recorder Merge During Export

If `request.recorder.eventsFile` is provided:

- events are loaded from NDJSON
- `message_update` updates content/edited timestamp for matching messages
- `message_delete` marks matching messages as deleted
- if enabled, missing deleted messages become placeholders:
  - `recorder.includeDeletedPlaceholders = true`

After merge, messages are sorted by snowflake ID.

## Ticket Close Helper

Function: `createTicketCloseHandler(options)`

```ts
interface TicketCloseHandlerOptions {
  token: string;
  logChannelId: string;
  formats?: Array<OutputFormat | string>;
  outputDir?: string;
  archiveThread?: boolean;
  closeReason?: string;
}
```

Behavior:

1. validates interaction channel
2. defers ephemeral reply
3. exports transcript for current ticket channel
4. uploads generated artifacts to log channel
5. optionally archives private thread
6. edits ephemeral reply with completion summary
