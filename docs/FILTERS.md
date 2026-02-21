# Filters Reference

The Filtering Engine in `@rayanmustafa/discord-chat-exporter` operates strictly on normalized `TranscriptMessage` payloads before any formats or analytical summaries are rendered.

---

## ⚙️ Operation Pipeline

Filtering is executed in two stages. A message **must pass both** to survive the export:

1. **DSL Filter Engine:** An Abstract Syntax Tree built of nested `AND/OR` groups and declarative `FilterCondition` objects.
2. **Predicate Callback:** An optional javascript function you supply for any custom ad-hoc validation.

---

## 🌳 Filter Groups (AST)

The `FilterGroup` defines the branching logic. Groups can infinitely nest inside each other.

```ts
interface FilterGroup {
  op: "AND" | "OR";
  conditions: Array<FilterCondition | FilterGroup>;
}
```

---

## 🔍 Defined Conditions

A `FilterCondition` requires a `kind` matching the specific operation you want, followed by properties unique to that exact check.

### Author & Identity

| `kind`          | Parameters                                 | Description                                                           |
| --------------- | ------------------------------------------ | --------------------------------------------------------------------- |
| `authorId`      | `values: string[]`                         | Matches if the sender ID is inside the array.                         |
| `username`      | `value: string`, `caseSensitive?: boolean` | Matches username (substring or exact regex).                          |
| `discriminator` | `value: string`                            | Matches explicit `#xxxx` discriminators.                              |
| `roleId`        | `values: string[]`                         | True if the message mentions one of these Roles.                      |
| `authorType`    | `value: 'bot' \| 'human'`                  | Human matching requires an author to exist and `author.bot !== true`. |
| `betweenUsers`  | `userA: string`, `userB: string`           | Enforces the message author to be one of the two IDs.                 |

### Chronology & Snowflakes

| `kind`         | Parameters                              | Description                                                 |
| -------------- | --------------------------------------- | ----------------------------------------------------------- |
| `date`         | `after?: string`, `before?: string`     | ISO-8601 string bounds.                                     |
| `relativeTime` | `lastDays`, `lastHours`, `lastMessages` | Useful for dynamic daily dumps.                             |
| `snowflake`    | `afterId?: string`, `beforeId?: string` | Chronological comparison utilizing native Discord `BigInt`. |

### Content Constraints

| `kind`            | Parameters                                                                                            | Description                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `contentContains` | `terms: string[]`, `mode: 'any'\|'all'`, `caseSensitive?: boolean`                                    | Basic text search.                                                  |
| `regex`           | `pattern: string`, `flags?: string`                                                                   | Executes native V8 Javascript RegEx evaluations on message content. |
| `has`             | `value: 'link'\|'attachment'\|'image'\|'video'\|'embed'\|'reaction'\|'emoji'\|'mention'\|'codeblock'` | Quick structural checks.                                            |
| `length`          | `min?: number`, `max?: number`                                                                        | Constrains message string length.                                   |

### Classification & Scopes

| `kind`        | Parameters                                                                                         | Description                                                                                                                |
| ------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `messageType` | `values: number[]`                                                                                 | Explicit Discord API [Type constants](https://discord.com/developers/docs/resources/message#message-object-message-types). |
| `state`       | `value: 'edited'\|'deleted'\|'pinned'\|'thread'\|'reply'\|'slash'\|'system'\|'poll'\|'components'` | Checks object statuses.                                                                                                    |
| `scope`       | `value: 'channelIds'\|'categoryIds'\|'threadIds'\|'ticketIds'`                                     | Requires the injection of `filterContext` map definitions.                                                                 |

---

## 👩‍💻 Predicate Callback (`predicate`)

For dynamic requirements that DSL structures cannot describe efficiently (e.g., matching User statuses to an external database during execution), provide a callback algorithm:

```ts
type MessagePredicate = (
  message: TranscriptMessage,
  ctx: FilterContext,
) => boolean | Promise<boolean>;
```

### Callback Constraints

Every predicate execution is provided alongside contextual details to prevent duplicated work:

```ts
interface FilterContext {
  channelId: string;
  categoryByChannelId: Record<string, string>;
  ticketByChannelId: Record<string, string>;
  now: Date;
  indexFromEnd: number; // Useful for slicing "last X messages" dynamically
}
```

---

## 📜 Full Syntax Example

Here is a complex filter setup executed inside `exportChannel(request)` that limits the export strictly to **Human Authors** who either **posted an attachment** OR used **urgent terminology**.

```ts
filters: {
  op: "AND",
  conditions: [
    { kind: "authorType", value: "human" },
    {
      op: "OR",
      conditions: [
        { kind: "has", value: "attachment" },
        { kind: "regex", pattern: "urgent|critical|broken", flags: "i" }
      ]
    }
  ]
}
```
