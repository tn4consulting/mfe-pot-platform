# mfe-pot-platform

> **Disclaimer:** This is an independent proof-of-technology project, not
> affiliated with, endorsed by, or associated with Service Canada,
> Employment and Social Development Canada (ESDC), or the Government of
> Canada in any way. "MSCA" and any GC branding/design-system references are
> used only to ground the proof of technology in a realistic scenario.

Getting-started guide for running the whole mfe-pot family locally. This is the
**"how do I actually run this thing"** doc — for architecture, rationale, and
gotchas, see [`CLAUDE.md`](./CLAUDE.md) (this repo) and
[`../CLAUDE.md`](../CLAUDE.md) (the repo map one level up).

If you only care about one app in isolation, see that app's own README instead
(`mfe-pot-shell/README.md`, `mfe-pot-dashboard/README.md`, etc.) — each is
independently buildable/testable/servable on its own.

## Prerequisites

- **[asdf](https://asdf-vm.com/)** with the `nodejs` plugin — this repo's
  `.tool-versions` pins the exact Node version (22.22.0; anything ≥ 22.12
  works, older 22.x versions fail on some build-time deps — see `CLAUDE.md`'s
  "Tooling" section).
- **pnpm** — not asdf-managed, install globally or via `corepack enable`.
- **A GitHub personal access token with `read:packages` scope** — every app
  repo's `pnpm install` pulls `@tn4consulting/shared-*` packages from GitHub
  Packages. Export it as `NODE_AUTH_TOKEN` (this repo's own `pnpm install`
  doesn't need it — its bare specifiers resolve straight to workspace source,
  see `CLAUDE.md`). If you have the `gh` CLI authenticated, `gh auth token`
  works as a substitute.
- **Docker Desktop**, **[kind](https://kind.sigs.k8s.io/)**, **helm**, and
  **kubectl** — only needed for the containerized loop (Strapi and the
  Kubernetes/Helm validation below). Not needed for the fast `nx serve` loop.

## First-time setup

1. Clone this repo and all 5 app repos as **siblings** in one parent folder —
   this repo's own multi-root workspace file expects that exact layout:
   ```bash
   mkdir mfe-pot && cd mfe-pot
   git clone git@github.com:tn4consulting/mfe-pot.git meta   # optional: repo map + TODO.md
   git clone git@github.com:tn4consulting/mfe-pot-platform.git
   git clone git@github.com:tn4consulting/mfe-pot-shell.git
   git clone git@github.com:tn4consulting/mfe-pot-dashboard.git
   git clone git@github.com:tn4consulting/mfe-pot-job-bank.git
   git clone git@github.com:tn4consulting/mfe-pot-employment-insurance.git
   git clone git@github.com:tn4consulting/mfe-pot-employment-life-events.git
   ```
   (If you cloned the `mfe-pot` meta repo directly, its `mfe-pot.code-workspace`
   already assumes the 6 repos live as its own subfolders — clone the other 5
   into that folder instead of a separate `meta` one.)
2. Open `mfe-pot.code-workspace` (in the `mfe-pot` meta repo) in VS Code for a
   multi-root view across all 6 repos.
3. Export your GitHub token: `export NODE_AUTH_TOKEN=<your token>`.
4. In **this repo**, install and sanity-check the build:
   ```bash
   pnpm install
   nx run-many -t lint,test,build --all
   ```
5. In each of the 5 app repos, `pnpm install`.

## The fast loop: `nx serve` per app

No containers needed. Each app and BFF is a plain `nx serve` in its own repo.
Run whichever subset you're working on — every app degrades gracefully
without its siblings running (each has its own stub/fallback for
auth/locale/registry, see `CLAUDE.md`'s "Independent testability").

| Repo | Project | Port |
|---|---|---|
| `mfe-pot-shell` | `shell` | 4200 |
| `mfe-pot-dashboard` | `dashboard` | 4201 |
| `mfe-pot-dashboard` | `dashboard-bff` | 3004 |
| `mfe-pot-employment-life-events` | `employment-life-events` | 4202 |
| `mfe-pot-job-bank` | `job-bank` | 4203 |
| `mfe-pot-job-bank` | `job-bank-bff` | 3001 |
| `mfe-pot-employment-insurance` | `employment-insurance` | 4204 |
| `mfe-pot-employment-insurance` | `employment-insurance-bff` | 3002 |
| `mfe-pot-platform` (this repo) | `client-profile-service` | 3003 |

```bash
# from each repo, in separate terminals:
pnpm exec nx serve shell                      # mfe-pot-shell
pnpm exec nx serve dashboard                   # mfe-pot-dashboard
pnpm exec nx serve dashboard-bff               # mfe-pot-dashboard
pnpm exec nx serve job-bank                    # mfe-pot-job-bank
pnpm exec nx serve job-bank-bff                # mfe-pot-job-bank
pnpm exec nx serve employment-insurance        # mfe-pot-employment-insurance
pnpm exec nx serve employment-insurance-bff    # mfe-pot-employment-insurance
pnpm exec nx serve employment-life-events      # mfe-pot-employment-life-events
pnpm exec nx serve client-profile-service      # mfe-pot-platform (this repo)
```

Then open `http://localhost:4200` (the shell) and sign in with the mock
login. Without Strapi running (see below), each app's `ContentClient` and the
shell's remote registry silently fall back to static content/config — you'll
still see the full app, just without CMS-editable text or a live federation
directory.

## Strapi (local CMS + federation directory)

Strapi only runs containerized (Firebase/`docker-compose` are both gone —
see `CLAUDE.md`'s "Local CMS / federation directory: Strapi"). It needs the
local `kind` cluster:

```bash
# in this repo (mfe-pot-platform)
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
build time).

## The full containerized loop (Docker + kind + Helm)

Validates the same shape that ships to production (one image per app,
runtime-injected config, Helm charts, Ingress) entirely on your machine —
see `CLAUDE.md`'s "Hosting: Kubernetes + Helm" for the full mechanism.

1. Deploy Strapi first (above) — it creates the shared `kind` cluster the app
   repos reuse.
2. In each app repo, run its own `pnpm deploy:local` (each repo's own
   `tools/deploy-local.sh` — builds that app's image(s), loads them into
   `kind`, and `helm upgrade --install`s that app's chart). Each app repo's
   chart depends on this repo's `charts/mfe-frontend-lib`/`mfe-backend-lib`
   library charts via a sibling-checkout-relative `file://` path, so the
   layout from "First-time setup" above matters here specifically.
3. Add all 5 app hostnames to `/etc/hosts` alongside `cms.mfe-pot.local`:
   ```
   127.0.0.1 shell.mfe-pot.local
   127.0.0.1 dashboard.mfe-pot.local
   127.0.0.1 job-bank.mfe-pot.local
   127.0.0.1 employment-insurance.mfe-pot.local
   127.0.0.1 employment-life-events.mfe-pot.local
   ```
4. Browse to `http://shell.mfe-pot.local`, or verify any app with curl, e.g.
   `curl -H "Host: job-bank.mfe-pot.local" http://localhost/`.

**Not containerized yet**: `client-profile-service` (this repo) has no
Dockerfile/chart yet — it's only ever run via `nx serve` even in the
containerized loop, so `dashboard-bff`'s profile/payments tiles will show
`unavailable` in a pure-kind stack unless you also have it running locally
on port 3003 reachable from the cluster (not currently wired — see
`../TODO.md`).

## Testing

- **Unit tests** (Jest), per repo: `nx run-many -t test --all`.
- **Composed integration suite** (`apps/mfe-e2e`, this repo): Playwright,
  covers routed federation, cross-remote widget embedding, the language
  broadcast, the BFF-backed golden path, and `@axe-core/playwright` WCAG 2.2
  AA scans. **Currently incomplete**: `playwright.config.ts`'s `webServer`
  array only starts `client-profile-service` — the rewire to also start the 5
  sibling apps from their checkout paths hasn't landed yet (see
  `../TODO.md`'s "Hosting / CI" section, "Phase 2"). Until then, run it
  against an already-running fast-loop stack (`reuseExistingServer` picks up
  anything already listening on the expected ports).

## Publishing a `libs/shared/*` package

Only needed if you're changing a shared library and want app repos to pick it
up. See `CLAUDE.md`'s "Strong contracts between split repos" section for the
mechanism (`tools/scripts/publish-shared-lib.mjs`) and a real gotcha to avoid
(a stray `dist/` folder inside a lib's own directory breaks Jest resolution
for every other project — don't run `nx build shared-<name>` by hand).

## Where to go next

- [`CLAUDE.md`](./CLAUDE.md) — full architecture, every non-obvious gotcha,
  and the rationale behind every decision above.
- [`../CLAUDE.md`](../CLAUDE.md) — the 6-repo map and cross-repo mechanics.
- [`../TODO.md`](../TODO.md) — outstanding work across the whole family.
