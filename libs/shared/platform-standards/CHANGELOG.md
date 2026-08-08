# Changelog

All notable changes to `@tn4consulting/shared-platform-standards` are
documented here, per the breaking-change/deprecation protocol in
`docs/plans/20260808-1200-multi-team-scale-governance.md` (item 4, in the
`mfe-pot` meta repo).

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
