# Recorder & Ticket Integration

This document covers two powerful features built deeply into `@rayanmustafa/discord-chat-exporter`: The Live Data Recorder, and the Ticket Close Handler designed specifically for automated bot ecosystems.

---

## ⏺️ Live Exporter Engine (Recorder)

The Discord REST API does not preserve message edit history or deleted message contents. To generate a 100% accurate audit trail, you must utilize the Live Recorder.

The Recorder uses `discord.js` under the hood to listen to WebSockets and dumps events into a continuous NDJSON (Newline Delimited JSON) file.

### Starting the Recorder

You can run the recorder detached via the CLI or programmatically.

**CLI Methods:**

- `dcexport record start` (Detaches to the background)
- `dcexport record stop` (Kills the detached session)

**TypeScript Config:**

```ts
interface RecorderStartOptions {
  token: string;
  outFile: string;
  guildIds?: string[]; // Optional Allowlist filters
  channelIds?: string[];
}
```

### Event Payload Scope

The recorder requires specific Gateway Intents to capture events (`Guilds`, `GuildMessages`, `MessageContent`, `GuildMessageReactions`).

> [!NOTE]  
> Every line written to the NDJSON file is a serialized `TranscriptEvent` object representing exactly one of the following:
>
> - `message_create`
> - `message_update`
> - `message_delete`
> - `reaction_add`
> - `reaction_remove`

### Recorder Merging

During a standard Export (`exportChannel()`), you can point `request.recorder` to your NDJSON log file. The pipeline will automatically map the missing historical data over the REST data.

| Event Recorded    | Pipeline Reaction                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------------------- |
| `message_update`  | Syncs content to the oldest or newest edit timestamp according to preferences.                                  |
| `message_delete`  | Changes the message status natively to `deleted`.                                                               |
| _Missing Deletes_ | If `recorder.includeDeletedPlaceholders = true`, the export generates visible phantom placeholders in the HTML. |

---

## 🎫 Ticket Close Helper

If you run a Discord Ticket support bot, you can inject `createTicketCloseHandler(options)` directly into your Discord interaction buttons (e.g., when a user clicks "Close Ticket").

### API Structure

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

### Automation Sequence

This pipeline executes safely and handles Discord rate limits automatically:

1. Validates the interaction channel.
2. Defers an ephemeral reply ("Closing ticket... please wait").
3. Executes a full `exportChannel()` on the current ticket channel.
4. Uploads all resulting artifacts to your hidden `logChannelId` automatically.
5. Archives the private thread if `archiveThread = true`.
6. Edits the original ephemeral reply notifying the user of successful completion.
