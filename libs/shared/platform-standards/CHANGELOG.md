# Changelog

All notable changes to `@tn4consulting/shared-platform-standards` are
documented here, per the breaking-change/deprecation protocol in
`docs/plans/20260808-1200-multi-team-scale-governance.md` (item 4, in the
`mfe-pot` meta repo).

## 0.2.0 — 2026-08-09

- `check-bff-boundaries` CLI: enforces the "UI apps/libraries may call only
  their own BFF" / "BFFs must not call each other" design principles (see
  `mfe-pot/TODO.md`'s "Design principles" section) via two grep-based
  checks over this repo's own `apps/**/*.{ts,tsx}` -- no in-cluster Service
  DNS literal in application source, no reference to another domain's
  dev-default BFF port. Not a full AST/data-flow analysis, same
  plain-script-over-parser precedent as `check-platform-versions`.
- `docs/PLATFORM_STANDARDS.md`'s "BFF boundary rules" section updated from
  "not yet fully enforced in code" to reflect this.

## 0.1.0 — 2026-08-08

Initial release.

- `check-platform-versions` CLI: resolved-version drift check against
  `platform-versions.json`, plus an optional `--check-critical-prs` backstop
  for stale `platform-critical`-labelled Renovate PRs.
- `sync-platform-standards` CLI: syncs `standards/PLATFORM_STANDARDS.md`
  into a consuming repo's `docs/`.
- Shared `configs/eslint.react.mjs` and `configs/jest.transform-ignore.cjs`
  — piloted on `mfe-pot-dashboard-mfe`, confirmed identical `nx lint`/
  `nx test` results before/after.
- `configs/tsconfig.base.json` — reference only, not consumable via
  `extends`. Piloting it live on `mfe-pot-dashboard-mfe` hit a real
  `@softarc/sheriff-core` incompatibility (Native Federation's build step
  fails once the extended base config lives in `node_modules`) — see that
  file's own `$comment`.
