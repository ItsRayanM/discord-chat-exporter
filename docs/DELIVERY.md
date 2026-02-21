# Delivery Targets

The `output.target` configuration controls the final destination of generated artifacts (HTML, JSON, PDFs, ZIPs, etc.).

---

## 🎯 Target Modes

| Mode                         | Description                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **`filesystem`** _(default)_ | Saves artifacts exclusively to the local disk path defined in `output.dir`.                                                    |
| **`discord-channel`**        | Uploads the artifacts directly to a Discord text channel. Leverages a temporary OS directory that is safely deleted afterward. |
| **`both`**                   | Saves locally to `output.dir` **and** uploads to Discord simultaneously.                                                       |

---

## 💻 Filesystem Delivery

The simplest and default delivery method.

- **Requirement:** `output.dir` **must** be defined when using `filesystem` or `both`.
- Outputs generated will be placed here verbatim.

---

## 📤 Discord Channel Delivery

This target utilizes Discord's REST API to POST message payloads containing your rendered exports as attachments.

### Core Properties

| Setting     | Type     | Description                                                                                        |
| ----------- | -------- | -------------------------------------------------------------------------------------------------- |
| `channelId` | `string` | **Required.** The target Discord channel ID.                                                       |
| `token`     | `string` | Optional override token used specifically for the upload delivery (falls back to `request.token`). |

### Customizing the Message payload

You can dynamically formulate the message content that goes alongside the sent files either statically or via functions.

| Method            | Type       | Description                                                                                                     |
| ----------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| `content`         | `string`   | Static text describing the upload. Use `{{files}}` to automatically inject an inventory list of uploaded items. |
| `getContent(ctx)` | `function` | Dynamic Function returning text/promises. Can still use the `{{files}}` syntax block.                           |
| `includeFileList` | `boolean`  | If true, an auto-generated list representing filename, format, and sizes is appended at the bottom.             |

### Rich Embeds

You can utilize standard Discord Embeds. A single message can hold up to 10 embeds.

| Property                    | Description                                                                |
| --------------------------- | -------------------------------------------------------------------------- |
| `embed` / `getEmbed(ctx)`   | Attach exactly **one** embed object based on the `DiscordEmbedData` shape. |
| `embeds` / `getEmbeds(ctx)` | Attach an array of up to 10 embed objects.                                 |

---

## 🧠 Building Dynamic Embeds (`DiscordDeliveryContext`)

When you define a function for `getContent()`, `getEmbed()`, or `getEmbeds()`, the library passes a contextual object so you can react dynamically to internal chunking or batching details.

**Properties of `DiscordDeliveryContext`:**

- `artifacts` — The exact files generated in this batch.
- `channelId` — Target deployment ID.
- `fileListText` — Pre-rendered Markdown string showing your files and sizes.
- `batchIndex`, `batchCount` — Indices. Discord limits 10 files per message, thus huge exports may split into multiple chunked message payloads.

> [!TIP]
>
> - **Batching limitations**: Discord caps attachment uploads to 10 files per message. The library automatically handles batching for you.
> - **Mentions disabled**: By default, `allowed_mentions.parse` is disabled to prevent accidental pings of users during data delivery.

---

## 🗑️ Temporary Output Directory Logic

When using `discord-channel` as your only target, specifying `output.dir` is optional.

- The exporter will utilize the system's temporary OS path.
- Once the Discord upload successfully finishes, the **temp directory is wiped automatically**.
- If you wish to examine these files post-export while keeping the target `discord-channel`, set `output.retainFiles = true` to abort the wipe process.

---

## 📜 Implementation Examples

### Standard Message with a File List

```ts
output: {
  target: "discord-channel",
  discord: {
    channelId: "987654321098765432",
    content: "Here is your transcript:\n\n{{files}}",
    includeFileList: true,
  },
  retainFiles: false,
}
```

### Dynamic Code Execution using `DiscordDeliveryContext`

```ts
import type { DiscordDeliveryContext, DiscordEmbedData } from "@rayanmustafa/discord-chat-exporter";

// Dynamically generate the top text body
function myContent(ctx: DiscordDeliveryContext): string {
  return `Transcript ready (batch ${ctx.batchIndex + 1}/${ctx.batchCount}).\n\n${ctx.fileListText}`;
}

// Dynamically generate an embed summarizing the process
function myEmbed(ctx: DiscordDeliveryContext): DiscordEmbedData {
  return {
    title: "Transcript export completed",
    description: `${ctx.artifacts.length} file(s) attached.`,
    color: 0x5865f2,
    timestamp: new Date().toISOString(),
    footer: { text: `Batch ${ctx.batchIndex + 1}/${ctx.batchCount}` },
  };
}

// Attach configuration
output: {
  target: "discord-channel",
  discord: {
    channelId: "987654321098765432",
    getContent: myContent,
    getEmbed: myEmbed,
  },
  retainFiles: false,
}
```
