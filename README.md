# mfe-pot-platform

> **Disclaimer:** This is an independent proof-of-technology project, not
> affiliated with, endorsed by, or associated with Service Canada,
> Employment and Social Development Canada (ESDC), or the Government of
> Canada in any way. "MSCA" and any GC branding/design-system references are
> used only to ground the proof of technology in a realistic scenario.

Getting-started guide for running **this repo's own pieces** standalone
(`client-profile-service`, Strapi, the composed `mfe-e2e` suite, publishing
`libs/shared/*`). **For running the whole mfe-pot family together, see
[`../README.md`](../README.md)** — that's the "how do I actually run this
thing end to end" doc, and it's kind/Helm-based, not `nx serve`. For
architecture, rationale, and gotchas, see [`CLAUDE.md`](./CLAUDE.md) (this
repo) and [`../CLAUDE.md`](../CLAUDE.md) (the repo map one level up).

If you only care about one app in isolation, see that app's own README
instead (`mfe-pot-shell/README.md`, `mfe-pot-dashboard/README.md`, etc.) —
each is independently buildable/testable/servable on its own.

## Prerequisites

- **[asdf](https://asdf-vm.com/)** with the `nodejs` plugin — this repo's
  `.tool-versions` pins the exact Node version (22.22.0; anything ≥ 22.12
  works, older 22.x versions fail on some build-time deps — see `CLAUDE.md`'s
  "Tooling" section).
- **pnpm** — not asdf-managed, install globally or via `corepack enable`.
  This repo's own `pnpm install` doesn't need a GitHub token — its bare
  specifiers resolve straight to workspace source, unlike the app repos.
- **Docker Desktop**, **[kind](https://kind.sigs.k8s.io/)**, **helm**, and
  **kubectl** — only needed to run Strapi (see below). Not needed for
  `client-profile-service`'s own `nx serve` loop or for the unit/lint/build
  targets.

## Setup

```bash
pnpm install
nx run-many -t lint,test,build --all
```

## Running `client-profile-service` standalone

No Dockerfile/chart exists for it yet (see `../TODO.md`) — it only ever runs
via:

```bash
pnpm exec nx serve client-profile-service   # port 3003
```

## Strapi (local CMS + federation directory)

Strapi only runs containerized (Firebase/`docker-compose` are both gone —
see `CLAUDE.md`'s "Local CMS / federation directory: Strapi"). It needs a
local `kind` cluster:

```bash
pnpm deploy:local
```

This builds the Strapi image, creates/reuses a `kind` cluster named `kind`,
installs `ingress-nginx`, and Helm-installs `charts/strapi` — seeding page
content and the remote directory idempotently on every run, no manual
admin-panel steps. Add this to `/etc/hosts` (kind has no real DNS):

```
127.0.0.1 cms.mfe-pot.local
```

Then visit `http://cms.mfe-pot.local/admin` — **first visit prompts you to
create the admin account** (no default credentials are seeded). Once Strapi
is up, restart any running `nx serve` frontends so `RemoteRegistryProvider`
picks it up (or just reload — it's polled per navigation, not cached at
build time). This is also the first step of `../README.md`'s full
whole-family kind walkthrough — every app repo's own `pnpm deploy:local`
reuses the cluster this creates.

## Testing

- **Unit tests** (Jest): `nx run-many -t test --all`.
- **Composed integration suite** (`apps/mfe-e2e`): Playwright, covers routed
  federation, cross-remote widget embedding, the language broadcast, the
  BFF-backed golden path, and `@axe-core/playwright` WCAG 2.2 AA scans.
  **Currently incomplete**: `playwright.config.ts`'s `webServer` array only
  starts `client-profile-service` — the rewire to also start the 5 sibling
  apps from their checkout paths hasn't landed yet (see `../TODO.md`'s
  "Hosting / CI" section, "Phase 2"). Until then, run it against an
  already-running stack (`reuseExistingServer` picks up anything already
  listening on the expected ports).

## Publishing a `libs/shared/*` package

Only needed if you're changing a shared library and want app repos to pick up
the change. See `CLAUDE.md`'s "Strong contracts between split repos" section
for the mechanism (`tools/scripts/publish-shared-lib.mjs`) and a real gotcha
to avoid (a stray `dist/` folder inside a lib's own directory breaks Jest
resolution for every other project — don't run `nx build shared-<name>` by
hand).

## Where to go next

- [`../README.md`](../README.md) — running the whole mfe-pot family together
  (kind/Helm-based), the full repo map, and where project-wide docs live.
- [`CLAUDE.md`](./CLAUDE.md) — full architecture, every non-obvious gotcha,
  and the rationale behind every decision above.
- [`../CLAUDE.md`](../CLAUDE.md) — the 6-repo map and cross-repo mechanics.
- [`../TODO.md`](../TODO.md) — outstanding work across the whole family.
