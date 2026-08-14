# Local setup: running the whole mfe-pot family on `kind`

This is the canonical "how do I actually run the whole family end to end"
guide — every app deployed as a real container to a local `kind` cluster via
Helm, the same shape that ships to production (one image per app,
runtime-injected config, Ingress), not `nx serve`. For architecture,
rationale, and gotchas behind any of this, see [`../CLAUDE.md`](../CLAUDE.md)
(this repo) and [`../../CLAUDE.md`](../../CLAUDE.md) (the repo map one level
up). For AWS EKS instead of local `kind`, see
[`eks-setup.md`](./eks-setup.md).

If you only care about one app in isolation (plain `nx serve`, no
containers), see that app's own README instead — every app is independently
buildable/testable/servable on its own by design.

## Prerequisites

- **[asdf](https://asdf-vm.com/)** with the `nodejs` plugin — each repo's
  `.tool-versions` pins the exact Node version (22.22.0; anything ≥ 22.12
  works, older 22.x versions fail on some build-time deps — see
  `../CLAUDE.md`'s "Tooling" section).
- **pnpm** — not asdf-managed, install globally or via `corepack enable`.
  This repo's own `pnpm install` doesn't need a GitHub token (its bare
  specifiers resolve straight to workspace source); every app repo's does.
- **A GitHub personal access token with `read:packages` scope** — every app
  repo's Docker image build pulls `@tn4consulting/shared-*` packages from
  GitHub Packages. Export it as `NODE_AUTH_TOKEN`, or have the `gh` CLI
  authenticated (`gh auth token` works as a substitute).
- **Docker Desktop**, **[kind](https://kind.sigs.k8s.io/)**, **helm**, and
  **kubectl** — the whole family runs as containers on a local `kind`
  cluster; there's no non-containerized way to run more than one app at a
  time.

## First-time setup

1. Clone the `mfe-pot` meta repo and all 6 app repos as **siblings** in one
   parent folder — the meta repo's own multi-root workspace file, and every
   app repo's `deploy-local.sh`, expect that exact layout:
   ```bash
   git clone git@github.com:tn4consulting/mfe-pot.git
   cd mfe-pot
   git clone git@github.com:tn4consulting/mfe-pot-platform.git
   git clone git@github.com:tn4consulting/mfe-pot-msca-shell.git
   git clone git@github.com:tn4consulting/mfe-pot-job-bank-shell.git
   git clone git@github.com:tn4consulting/mfe-pot-dashboard-mfe.git
   git clone git@github.com:tn4consulting/mfe-pot-job-bank-mfe.git
   git clone git@github.com:tn4consulting/mfe-pot-employment-insurance-mfe.git
   git clone git@github.com:tn4consulting/mfe-pot-life-events-mfe.git
   ```
   The 4 remotes' GitHub repo names carry the `-mfe` suffix too (see
   `../../CLAUDE.md`'s "Naming convention" bullet) — same as the local
   directory name, no explicit target directory needed.
2. Open `mfe-pot.code-workspace` (in the meta repo) in VS Code for a
   multi-root view across all 7 repos.
3. Export your GitHub token: `export NODE_AUTH_TOKEN=<your token>`.
4. In `mfe-pot-platform`, install deps and sanity-check the build:
   ```bash
   cd mfe-pot-platform
   pnpm install
   nx run-many -t lint,test,build --all
   ```
5. In each of the 6 app repos, `pnpm install`.

## Running the whole stack on `kind`

Each repo's `pnpm deploy:local` is idempotent — safe to rerun after a code
change.

**Fastest path**: run `tools/deploy-local.sh` from the meta repo. It
delegates, in order, to each sibling's own `tools/deploy-local.sh` —
`mfe-pot-platform` first for shared infra (the `session-cache` Redis
instance, the `unleash` feature-flag server, the OpenTelemetry stack, Strapi,
and `mock-idp`), then the 3 BFF-owning apps, then the 3 frontend-only apps
(life-events, then both host apps last) — and skips any sibling repo whose
git tree (HEAD plus any uncommitted/untracked changes) hasn't changed since
its last successful deploy and whose Helm release(s) are still present on
the cluster, so a routine rerun after editing one app only
rebuilds/redeploys that one. Pass `-f`/`--force` to rebuild everything
regardless.

The manual step-by-step walkthrough below is what it does under the hood —
useful if you want to run one repo's step in isolation or see exactly what
happens.

1. **Deploy shared platform infra first** (from `mfe-pot-platform`) — this
   creates/reuses the shared `kind` cluster (named `kind` by default;
   override with `CLUSTER_NAME` if you already use that name for something
   else) that every app repo below reuses, installs `ingress-nginx`, and
   Helm-installs `session-cache`, `unleash`, the OpenTelemetry stack
   (`otel-collector`, `tempo`, `kube-state-metrics`, `prometheus`,
   `grafana`), `charts/strapi` (seeding page content and the remote
   directory idempotently on every run — no manual admin-panel steps), and
   `mock-idp`:
   ```bash
   cd mfe-pot-platform
   pnpm deploy:local
   ```
2. **Deploy each app repo**, in any order:
   ```bash
   cd ../mfe-pot-msca-shell                && pnpm deploy:local
   cd ../mfe-pot-job-bank-shell             && pnpm deploy:local
   cd ../mfe-pot-dashboard-mfe              && pnpm deploy:local
   cd ../mfe-pot-job-bank-mfe               && pnpm deploy:local
   cd ../mfe-pot-employment-insurance-mfe   && pnpm deploy:local
   cd ../mfe-pot-life-events-mfe            && pnpm deploy:local
   ```
   Each script builds that repo's image(s), loads them into `kind` (no
   registry round-trip), and `helm upgrade --install`s that repo's chart —
   it needs `mfe-pot-platform` checked out as a sibling for the Helm
   library-chart `file://` dependency and (for Strapi's own hostname) the
   shared `kind-config.yaml`.
3. **Add every app's hostname to `/etc/hosts`** (`kind` has no real DNS):
   ```
   127.0.0.1 cms.mfe-pot.local
   127.0.0.1 mock-idp.mfe-pot.local
   127.0.0.1 unleash.mfe-pot.local
   127.0.0.1 otel.mfe-pot.local
   127.0.0.1 grafana.mfe-pot.local
   127.0.0.1 msca.mfe-pot.local
   127.0.0.1 job-bank.mfe-pot.local
   127.0.0.1 dashboard-mfe.mfe-pot.local
   127.0.0.1 job-bank-mfe.mfe-pot.local
   127.0.0.1 employment-insurance-mfe.mfe-pot.local
   127.0.0.1 life-events-mfe.mfe-pot.local
   ```
   `unleash` (feature-flag admin/API), `otel` (the OTLP/HTTP collector
   endpoint browsers export traces to), and `grafana` (dashboards for the
   BFF RED metrics/traces the family emits) are platform-owned demo/
   observability surfaces, not citizen-facing apps — `tempo`/`prometheus`
   have no Ingress at all (cluster-internal only), so they're not in this
   list.
   The two host apps ("front doors") keep plain brand names —
   `msca.mfe-pot.local`, `job-bank.mfe-pot.local` — while every internal
   federated remote gets an `-mfe` suffix, since `job-bank.mfe-pot.local`
   (the job-bank-shell host) and `job-bank-mfe.mfe-pot.local` (the job-bank
   remote it composes) would otherwise be one hyphen apart and easy to
   confuse.
4. Browse to `http://msca.mfe-pot.local` and sign in with the mock login,
   and separately to `http://job-bank.mfe-pot.local` to see the second,
   minimal host — same shared `mock-idp`, distinct branding — or verify any
   single app with curl, e.g.
   `curl -H "Host: job-bank-mfe.mfe-pot.local" http://localhost/`. First
   visit to `http://cms.mfe-pot.local/admin` prompts you to create the
   Strapi admin account (no default credentials are seeded). Once Strapi is
   up, restart any running `nx serve` frontends so `RemoteRegistryProvider`
   picks it up (or just reload — it's polled per navigation, not cached at
   build time). `http://unleash.mfe-pot.local` works differently: `charts/unleash`
   only bootstraps its three API tokens
   (`INIT_ADMIN_API_TOKENS`/`INIT_CLIENT_API_TOKENS`/`INIT_FRONTEND_API_TOKENS`
   in `mfe-pot-platform/charts/unleash/values.yaml`) on startup, not a UI
   password, so the admin UI login is Unleash's own out-of-the-box default
   (`admin` / `unleash4all`) rather than anything this family sets.

## Iterating on one app without a full `kind` rebuild

Redeploying an app's image to `kind` on every code change is slow — fine for
verifying the whole family together, not for a tight edit/reload loop on one
app. Because remote discovery is a **live, Strapi-backed directory** (not a
file baked into a shell's build — see `../CLAUDE.md`'s "Federation"
section), you can leave the rest of the family running on `kind` and swap
just the one app you're iterating on for a local dev server:

1. Leave the full `kind` stack up (steps above).
2. Run the app you're changing standalone instead of via its `kind` pod —
   e.g. `cd mfe-pot-job-bank-mfe && pnpm exec nx serve job-bank-mfe`
   (port 4203; see that repo's own README for its exact serve command/port).
   Its dev server sends `Access-Control-Allow-Origin: *`, so a `kind`-hosted
   shell can load it cross-origin with no extra config.
3. In the Strapi admin (`http://cms.mfe-pot.local/admin`), edit that app's
   `Remote` entry's URL to point at your local dev server (e.g.
   `http://localhost:4203/remoteEntry.json`) instead of its `kind` Ingress
   URL.
4. Reload the shell — `RemoteRegistryProvider` is polled per navigation, not
   cached at build time, so no shell rebuild/restart is needed. Point the
   Strapi entry back at the `kind` URL when you're done.

This only swaps a **routed remote** (a full app screen). A cross-remote
*widget* (e.g. dashboard's payment-history widget embedded in life-events)
is loaded by whichever host mediates it, through the same registry entry —
the same swap works, just double-check which host ("shell") is doing the
mediating for that particular widget (see `../CLAUDE.md`'s "Federation"
section).

**Redeploying one app's container in place**, as an alternative to the
`nx serve` swap above: once the shared cluster is up, `cd` into any single
sibling repo and re-run `pnpm deploy:local` — it rebuilds and redeploys only
that repo's own image(s) onto the existing shared cluster, force-restarting
its Deployment(s) so the rebuilt image is actually picked up, with no effect
on any other app. Slower than the `nx serve` swap (a real image build +
`kind load` + Helm upgrade) but exercises the actual container/Ingress/Helm
path production uses, rather than a locally-served dev bundle — reach for
this when you specifically need to verify that path for one app, not for a
fast edit/reload loop.

## Testing

Three tiers, cheapest/fastest first:

- **Per-app unit tests + lint** (Jest/ESLint), the tight inner loop for a
  single app — no `kind`, no sibling repos running: `pnpm exec nx test
  <app>` / `pnpm exec nx lint <app>` inside that app's own repo. Across
  every repo at once: `nx run-many -t test --all` (run from each repo —
  there's no single workspace root that spans all 7).
- **One app's own standalone serve**, no shell/siblings required — every
  app is independently buildable/serveable/testable by design (see
  `../CLAUDE.md`'s "Independent testability" section). Use this to verify
  an app's own behavior in isolation before checking it federated.
- **The full family on `kind`** (this doc's main walkthrough above) — the
  only way to exercise real cross-app behavior: routed federation across
  hostnames, cross-remote widget embedding, the BFF-backed golden path
  (apply for a job, apply for EI, see it land in the dashboard overview),
  the language-switch broadcast across independently-loaded remotes, and
  the real container/Ingress/Helm shape production uses. Use the
  "iterating on one app" workflow above to keep this loop fast while
  changing one app. This repo's own composed `apps/mfe-e2e` Playwright
  suite (routed federation, cross-remote widgets, the language broadcast,
  the BFF-backed golden path, and `@axe-core/playwright` WCAG 2.2 AA scans)
  automates most of this, but is **currently incomplete**:
  `playwright.config.ts`'s `webServer` array is empty — nothing in this
  repo starts anything anymore now that `client-profile-service` is gone
  (see `../../TODO.md`'s "Hosting / CI" section, "Phase 2"). Until then,
  run it against an already-running stack (`kind`, or several apps' own
  `nx serve` — `reuseExistingServer` picks up anything already listening on
  the expected ports).

## Publishing a `libs/shared/*` package

Only needed if you're changing a shared library and want app repos to pick
up the change. See `../CLAUDE.md`'s "Strong contracts between split repos"
section for the mechanism (`tools/scripts/publish-shared-lib.mjs`) and a
real gotcha to avoid (a stray `dist/` folder inside a lib's own directory
breaks Jest resolution for every other project — don't run
`nx build shared-<name>` by hand).
