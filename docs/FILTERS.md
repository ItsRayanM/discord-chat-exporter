# Filters Reference

Filtering is applied to normalized transcript messages before rendering.

Pipeline order:

1. `filters` (group/AST)
2. `predicate` callback (if provided)

Only messages passing both are exported.

## Structure

```ts
interface FilterGroup {
  op: "AND" | "OR";
  conditions: Array<FilterCondition | FilterGroup>;
}
```

Nested groups are fully supported.

## Conditions

### Author/User Conditions

- `authorId`: author ID is in provided list
- `username`: username match with optional case sensitivity
- `discriminator`: discriminator match
- `roleId`: checks mentioned roles in message
- `authorType`: `"bot"` or `"human"`
  - `"human"` matches only messages where author exists and `author.bot !== true`
- `betweenUsers`: author is either user A or B

### Time/Snowflake Conditions

- `date`: `after` / `before` ISO strings
- `relativeTime`: `lastDays`, `lastHours`, `lastMessages`
- `snowflake`: compares message IDs via `BigInt`

### Content Conditions

- `contentContains`: term search with mode `"any"` or `"all"` and case control
- `regex`: JavaScript regex pattern/flags
- `has`:
  - `link`
  - `attachment`
  - `image`
  - `video`
  - `embed`
  - `reaction`
  - `emoji` (unicode + custom emoji format)
  - `mention`
  - `codeblock`
- `length`: min/max content length

### Type/State/Scope Conditions

- `messageType`: numeric Discord message types
- `state`:
  - `edited`
  - `deleted`
  - `pinned`
  - `thread`
  - `reply`
  - `slash`
  - `system`
  - `poll`
  - `components`
- `scope`:
  - `channelIds`
  - `categoryIds` (requires `filterContext.categoryByChannelId`)
  - `threadIds`
  - `ticketIds` (requires `filterContext.ticketByChannelId`)

## Predicate Callback

```ts
type MessagePredicate = (
  message: TranscriptMessage,
  ctx: FilterContext,
) => boolean | Promise<boolean>;
```

Use this for custom logic not expressible via DSL.

## Context Passed to Filters

```ts
interface FilterContext {
  channelId: string;
  categoryByChannelId: Record<string, string>;
  ticketByChannelId: Record<string, string>;
  now: Date;
  indexFromEnd: number;
}
```

## Example

```ts
filters: {
  op: "AND",
  conditions: [
    { kind: "authorType", value: "human" },
    {
      op: "OR",
      conditions: [
        { kind: "has", value: "attachment" },
        { kind: "regex", pattern: "urgent|critical", flags: "i" }
      ]
    }
  ]
}
```
