# Development and Testing

## Scripts

From `package.json`:

- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run prepublishOnly`
- `npm run dev`
- `npm run clean`

## Local Dev Loop

1. Edit source under `src/`
2. Run `npm run typecheck`
3. Run `npm test`
4. Run `npm run build`

## Test Suite

Current tests in `test/`:

- `analytics-report.test.ts`
- `ai-heuristic.test.ts`
- `ai-providers-http.test.ts`
- `filter-engine.test.ts`
- `html-renderer.test.ts`
- `discord-delivery.test.ts`
- `database-delivery.test.ts`

## Build Output

- TypeScript compiles to `dist/`
- Declarations are emitted (`.d.ts`)
- Module system: `NodeNext`

## Packaging Notes

- npm package exports from `dist/`
- CLI bin entry: `dist/cli.js`
- files published:
  - `dist`
  - `README.md`
  - `LICENSE`

## Clean Script

`scripts/clean.mjs` removes `dist/`.
