# Developer setup

Getting a dev machine ready to work **in this repo** — editor, toolchain,
lint/test/build loop. This is narrower than
[`local-setup.md`](./local-setup.md) (which stands up the *whole family* on
`kind` for a demo) and [`eks-setup.md`](./eks-setup.md) (AWS hosting) — read
this one first if you're just here to write code.

If you're setting up a different sibling repo (one of the 6 app repos), the
same shape applies but check that repo's own README/CLAUDE.md for its
specifics (it needs a GitHub token to pull `@tn4consulting/shared-*`
packages; this repo's own `pnpm install` doesn't).

## Prerequisites

- **[asdf](https://asdf-vm.com/)** with the `nodejs` plugin. `.tool-versions`
  at repo root pins the exact version (22.22.0). Run `asdf install` after
  cloning. Anything ≥ 22.12 works — several build-time deps (e.g.
  `magic-string`) ship ESM-only builds that need Node's unflagged
  `require(esm)` support, so older 22.x versions fail with a
  `require() of ES Module ... not supported` error. See `../CLAUDE.md`'s
  "Tooling" section if you hit that.
- **pnpm** — not asdf-managed; install globally or via `corepack enable`.
- **Git**, obviously — and the `mfe-pot` meta repo + the 6 app repos cloned
  as **siblings** if you'll ever touch more than this one repo (see
  `local-setup.md`'s "First-time setup" for the exact clone list and layout
  — the multi-root VS Code workspace and every app's `deploy-local.sh`
  assume it).
- **Docker Desktop**, **[kind](https://kind.sigs.k8s.io/)**, **helm**,
  **kubectl** — only needed to run Strapi locally or the whole family (see
  `local-setup.md`). Not needed for this repo's own lint/test/build loop.

## Editor setup

VS Code is the reference editor — `.vscode/extensions.json` lists the
recommended extensions (VS Code will prompt to install them on open):
- `dbaeumer.vscode-eslint` — inline lint errors from `eslint.config.mjs`.
- `esbenp.prettier-vscode` — formatting from `.prettierrc`/`.prettierignore`.
  Turn on format-on-save so you're not manually running `prettier` — this
  repo has no pre-commit formatting hook, so an unformatted diff is a
  common review-comment source if you skip this.
- `firsttris.vscode-jest-runner` — run/debug a single Jest test from the
  gutter instead of the full `nx test` target.
- `nrwl.angular-console` — Nx's project graph/target-runner UI. Predates
  this family's Angular→React migration in name only; still useful for any
  Nx workspace.

For the multi-repo view across all 7 repos, open `../../mfe-pot.code-workspace`
(one level up, in the meta repo) instead of this repo alone.

## Install and sanity-check

```bash
pnpm install
nx run-many -t lint,test,build --all
```

This repo's `pnpm install` doesn't need a GitHub token — its bare specifiers
resolve straight to workspace TS source via `tsconfig.base.json` paths,
unlike every app repo (which pulls published `@tn4consulting/shared-*`
packages from GitHub Packages and needs `NODE_AUTH_TOKEN` — see
`.npmrc`/`local-setup.md`).

## Day-to-day dev loop

- **Single project**: `nx test <project>` / `nx lint <project>` / `nx build
  <project>` — faster than `run-many` while iterating on one lib/app.
- **Only what changed**: `nx affected -t lint,test,build` — compares
  against the base branch, useful before pushing.
- **The 4 BFF-shaped Express apps' lint target is named `eslint:lint`, not
  `lint`** — the `@nx/node` generator doesn't add a plain `lint` target the
  way frontend projects' `project.json` does. `nx run <bff>:eslint:lint`
  directly, or note that `run-many --target=lint` silently skips them. (Not
  relevant in this repo today — no BFF lives here — but worth knowing if
  you're also working in an app repo.)
- **Strapi / the composed `mfe-e2e` suite / publishing a `libs/shared/*`
  package** — see `local-setup.md`'s dedicated sections; those need the
  `kind` cluster or a sibling repo to be meaningful, so they're documented
  there, not here.

## Conventions

- **Follow lint rules; don't suppress them.** A failing rule means fix the
  code, or, if the rule is genuinely wrong for a case, change the rule
  deliberately and say why — not an inline disable comment. See
  `../CLAUDE.md`'s "Linting" section.
- **TypeScript everywhere**, including the BFF/service apps, not just the
  React code.
- A `libs/shared/*` package's own `dist/` folder should never exist except
  transiently during an actual `npm publish` — running `nx build shared-<name>`
  by hand leaves one behind and breaks Jest resolution for other projects
  that import it. See `../CLAUDE.md`'s "Strong contracts between split
  repos" section if you hit an odd "can't resolve" error right after a
  manual lib build.

## Where to go next

- [`local-setup.md`](./local-setup.md) — running the whole family on a local
  `kind` cluster.
- [`eks-setup.md`](./eks-setup.md) — hosting the family on AWS EKS.
- [`../CLAUDE.md`](../CLAUDE.md) — full architecture, rationale, and every
  non-obvious gotcha.
- [`../../CLAUDE.md`](../../CLAUDE.md) — the 7-repo map and cross-repo
  mechanics.
- [`../../TODO.md`](../../TODO.md) — outstanding work across the family.
