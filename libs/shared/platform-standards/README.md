# @tn4consulting/shared-platform-standards

Multi-team coordination tooling for the mfe-pot family. Built to answer one
question: as the family moves from one maintainer to one team per repo,
what stops a team from silently drifting out of sync with the others —
without requiring anyone to have every other repo cloned locally?

Full design rationale: `../../../../docs/plans/20260808-1200-multi-team-scale-governance.md`
(in the `mfe-pot` meta repo).

## What's in here

- **`bin/check-platform-versions.mjs`** — CLI. Fetches `platform-versions.json`
  live from this repo's `main` by default (no sibling clone needed), checks
  this repo's *resolved* dependency versions against it, fails with a clear
  diff on drift. Run via `pnpm run check:versions` in any consuming repo.
- **`bin/sync-platform-standards.mjs`** — CLI, meant for a `postinstall`
  hook. Copies `standards/PLATFORM_STANDARDS.md` into the consuming repo's
  own `docs/PLATFORM_STANDARDS.md`, so that repo's `CLAUDE.md` can
  `@`-import a real file instead of a dead cross-repo reference.
- **`standards/PLATFORM_STANDARDS.md`** — the curated, enforceable subset
  of `mfe-pot-platform/CLAUDE.md`'s standards. Not the full architecture
  doc on purpose — see the file itself.
- **`configs/`** — shared ESLint (React/a11y layer) and Jest
  `transformIgnorePatterns` fragments, each a faithful extraction of what
  every app repo was already independently declaring, confirmed via a real
  migration + `nx lint`/`nx test`/`nx build` on `mfe-pot-dashboard-mfe`
  (identical results before/after). `configs/tsconfig.base.json` is
  **reference-only, not consumable via `extends`** — piloting it live hit a
  real `@softarc/sheriff-core` incompatibility (Native Federation's build
  step throws once the extended base config lives in `node_modules` — see
  that file's own `$comment` for the exact failure). It documents the
  canonical option list; each repo still declares its own
  `tsconfig.base.json` inline.

## Why this package has no build step

Deliberately plain files, no `tsconfig.lib.json`, no Nx `project.json` —
same shape as `@tn4consulting/shared-federation-config` (see that
package's own comment). Everything here is either a directly-runnable
`.mjs` script (shebang works natively, no compile step needed) or a static
config/doc file consumed by path, not imported as a compiled JS API. Adding
a build step here would only add a stale-`dist/`-vs-source resolution risk
(see `mfe-pot-platform/CLAUDE.md`'s "A real gotcha discovered building the
publish pipeline") for no benefit.

## Distribution

Published to GitHub Packages via the same `tools/scripts/publish-shared-lib.mjs`
pipeline every other `libs/shared/*` package uses. Consumers add it as a
normal `pnpm` devDependency; updates arrive as ordinary Renovate PRs (see
the design doc's item 3) — never a silent background pull.
