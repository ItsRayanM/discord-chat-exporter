# Run from repo root: .\scripts\git-commits-staged.ps1
# Creates many small, separate commits. template/ is ignored via .gitignore.

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

function Commit {
  param([string]$paths, [string]$msg)
  $arr = $paths -split "\s+"
  git add @arr
  $diff = git diff --cached --name-only
  if ($diff) { git commit -m $msg }
}

Commit ".gitignore" "chore: add .gitignore"
Commit "LICENSE README.md" "docs: add LICENSE and README"
Commit "package.json package-lock.json" "chore: add package.json and lockfile"
Commit "tsconfig.json eslint.config.mjs vitest.config.ts" "chore: add tsconfig, eslint, vitest config"
Commit "docs" "docs: add documentation"
Commit "scripts" "chore: add scripts"
Commit "src/types src/types.ts" "feat(types): add type definitions"
Commit "src/shared" "feat(shared): add shared utils and errors"
Commit "src/modules/discord" "feat(discord): add Discord API client and collector"
Commit "src/modules/transcript" "feat(transcript): add normalize, filter-engine, attachments, redaction, delta"
Commit "src/modules/export" "feat(export): add export application and infrastructure"
Commit "src/modules/rendering" "feat(rendering): add rendering module"
Commit "src/modules/delivery" "feat(delivery): add delivery module"
Commit "src/modules/analytics" "feat(analytics): add analytics module"
Commit "src/modules/ai" "feat(ai): add AI module"
Commit "src/modules/compliance" "feat(compliance): add compliance module"
Commit "src/modules/scheduler" "feat(scheduler): add scheduler module"
Commit "src/modules/recorder" "feat(recorder): add recorder module"
Commit "src/modules/integrations" "feat(integrations): add integrations module"
Commit "src/modules/cli" "feat(cli): add CLI module"
Commit "src/core src/index.ts" "feat(core): add core exporter and index"
Commit "test" "test: add test suite"

Write-Host "`nDone. Recent commits:"
git log --oneline -25
