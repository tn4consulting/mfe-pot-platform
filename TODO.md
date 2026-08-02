# TODO

Outstanding work, pulled from the "Known gap" call-outs in `CLAUDE.md` and the
Demo Narrative section of `docs/plans/mfe-pot-initial-design.md`.
Update this alongside those docs as items land.

## Known gaps (architecture is built, behavior isn't finished)

- [ ] `pnpm demo:reset` — the 4 BFFs hold in-memory state with no reset endpoint,
      so local/CI runs accumulate applications and claims. `mfe-e2e`'s golden-path
      test already works around this with loose assertions instead of exact counts.
- [ ] Hosted (Firebase) build: sessionStorage write-through-over-static-JSON
      fallback for BFF-backed calls isn't built yet. Job search/apply, EI
      apply/claims/reporting, and the dashboard overview/payment tiles just show
      "temporarily unavailable" (or don't render) on the hosted build until this exists.
- [ ] Payment-history widget (embedded in `employment-life-events`) still renders
      static English mock data — heading, benefit names, dates, currency — none of
      it wired to Transloco/locale-aware formatting yet.
- [ ] Replace the `build-hosted` federation-manifest copy-step hack
      (`federation.manifest.prod.json` swapped in post-build) with the real
      `RemoteRegistryProvider` abstraction (Strapi-backed / static-JSON-backed)
      once that fallback path is built out for the hosted target.

## Demo narrative (proves the point, not just the pattern)

- [ ] Siloed-mode toggle in the shell — disables the cross-service calls
      `employment-life-events`/`benefit-aggregation-bff` normally make, so the
      citizen re-enters details separately and sees three disconnected status
      pages. The "before" picture for the demo.
- [ ] Live "tell us once" demo beat — address/bank details entered once in the
      `employment-life-events` journey visibly pre-fill the EI application and
      Job Bank profile, actually crossing the `client-profile-service` boundary.
- [ ] Visible policy-outcome proxy — a journey meter (systems touched, fields
      re-entered, steps remaining, simulated calendar day) fed by both modes:
      siloed mode starts job search ~day 24, life-event mode starts day 1.
- [ ] "Show the seams" overlay — a keypress outlines each federated region on
      screen, labelled with remote name/origin/version read live from
      `RemoteRegistryProvider`.
- [ ] Demo runbook — named persona, timed beats (~5-10 min), and the
      `pnpm demo:reset` command above so the demo can be run live more than once.
- [ ] Committed persona/fixture data pack across the BFFs and Strapi — plausible
      Canadian address, ROE, EI amounts/dates, job postings shaped like real
      jobbank.gc.ca listings. French fixtures must be genuinely translated, not
      machine-translated.
- [ ] Bilingual switch demoed as a real flex — triggered mid-EI-application,
      showing form state preserved, CMS content swapped, currency/date
      reformatting (`1 234,56 $`), and the payment-history widget re-rendering
      in French simultaneously inside `employment-life-events`.

## Hosting migration: Firebase → Kubernetes (AKS + local k8s), via Helm

Decided 2026-08-01: moving off Firebase Hosting to Kubernetes — Azure
Kubernetes Service (AKS) in the cloud, plus a local k8s option — deployed via
Helm charts, replacing `docker-compose.yml` too. Per `CLAUDE.md`'s Hosting
section, this is **not yet designed**: Dockerfiles, chart shape, registry
choice, and AKS access from CI are all still open. An earlier version of this
TODO named Azure Red Hat OpenShift (ARO) + Kustomize as the target instead —
that was superseded; AKS + Helm is the current decision. The ARO-specific
research below (IaC tool, Route vs Ingress, CRC parity) does not carry over
as-is and would need to be redone for AKS/Helm if still relevant.

**Research already done that still applies (don't re-derive):**
- Only `shell`/`dashboard` are actually deployed today (`firebase.json`/`.firebaserc`
  only define those two targets); `job-bank`, `employment-insurance`,
  `employment-life-events`, and all 4 BFFs have never been hosted anywhere.
- No Dockerfiles exist anywhere except a dev-mode one for Strapi
  (`tools/cms/strapi/Dockerfile`). No `.github/` CI exists at all — this is a
  greenfield CI/CD build, not a migration of an existing pipeline.
- The 4 BFFs already read `PORT`/`HOST`/upstream-URL env vars
  (`benefit-aggregation-bff`'s `JOB_BANK_BFF_URL` etc.) and their Nx `prune`
  build target already produces a deployable Node package (own `package.json`
  + pruned lockfile) — container-ready with minimal rework.
- The `import.meta.url`-based per-app origin resolution (used for Transloco
  asset base URLs) is already fully origin-agnostic — should need zero code
  changes to work behind a k8s Ingress instead of a Firebase site, though this
  hasn't been re-confirmed against AKS/Ingress specifically (the earlier
  confirmation was against an OpenShift Route, under the superseded ARO plan).
- The one real Firebase-specific liability: `apps/shell/public/federation.manifest.prod.json`
  hardcodes `https://mfe-pot-dashboard.web.app/remoteEntry.json` and only lists
  `dashboard`; the `build-hosted` Nx target (copy-step hack) swaps it in only
  for Firebase deploys. Needs a real replacement — also an opportunity to
  finally wire in all 4 remotes for a "hosted" build, not just dashboard.
- `libs/shared/remote-registry` has two provider classes
  (`StrapiRemoteRegistryProvider`, `StaticRemoteRegistryProvider`) — not three
  as CLAUDE.md currently claims — and **neither is actually wired into the
  running shell**; `apps/shell/src/main.ts` duplicates the fetch logic inline
  instead (deliberately, per its own comment, since bare-specifier workspace
  libs can't be imported from `main.ts`). Worth deciding whether to fix this
  as part of the move.
- `docker-compose.yml` currently only runs Strapi — no compose services yet
  for the 5 frontends or 4 BFFs, and it's slated for replacement by the k8s
  move anyway rather than being extended.
- `docs/en/`, `docs/fr/`, and `pnpm demo:reset` don't exist yet either — both
  are described in CLAUDE.md/the design doc as aspirational, not built.

**Open decisions to make before finalizing the plan:**
- [ ] How to fix the manifest/registry gap: (a) startup-time env-var render of
      `federation.manifest.json` per container (works the same in local k8s
      and AKS), (b) actually wire the existing Strapi-backed/static registry
      providers into `main.ts` for real, or (c) minimal fix — just extend
      `federation.manifest.prod.json` to list all 4 hosted URLs and keep the
      existing copy-step hack.
- [ ] Helm chart shape: one shared parameterized chart for the 5 Angular apps
      vs. a chart per repo (relevant once the per-app repo split below lands),
      and a different chart shape for the 4 Express BFFs (see "Repo split"
      section below).
- [ ] Container registry choice (e.g. ACR) and how images get there from CI.
- [ ] AKS access from CI (auth/credentials, which workflow step deploys).
- [ ] Local k8s option: which tool (kind/minikube/k3d/etc.), and whether it's
      a manual one-time local setup vs. scripted — vs. docker-compose only for
      now and deferring real local-k8s parity.
- [ ] IaC tool for the Azure side (AKS cluster + ACR + resource group +
      networking): Bicep vs Terraform vs hand-run `az` CLI runbook only.
- [ ] Provisioning approach: scaffold IaC/scripts only (user runs the actual
      billable `az`/deploy commands themselves), vs walk through provisioning
      together live in a session.

**Once those are answered**, still need to: write Dockerfiles for all 9 apps,
write the Helm chart(s) and Kubernetes manifests (Deployment/Service/Ingress),
write a GitHub Actions workflow (build/test/lint via `nx affected`, build+push
images, `helm upgrade --install`), update CLAUDE.md's Hosting section once the
migration actually lands (it currently still documents Firebase as today's
deployed state), and add a new dated planning doc under `docs/plans/` per the
naming convention in CLAUDE.md's "Planning documents" section.

## Repo split: monorepo → platform repo + 5 per-app repos

Per CLAUDE.md's "Monorepo → per-app repos (in progress)" section: this repo
becomes the platform repo; 5 new per-app repos already exist under
`tn4consulting` (`mfe-pot-shell`, `mfe-pot-dashboard`, `mfe-pot-job-bank`,
`mfe-pot-employment-insurance`, `mfe-pot-employment-life-events`). What's
actually done vs. still outstanding, confirmed against the filesystem:

**Done:**
- `platform-versions.json` exists at repo root as the pinned-version source
  of truth.
- `@nx/enforce-module-boundaries` tightened to real per-scope tag rules
  (was previously wide-open), and the one violation it caught
  (`PAYMENT_HISTORY_WIDGET_LOADER`) is fixed.
- All 7 `libs/shared/*` packages (`auth`, `content-client`,
  `federation-config`, `federation-runtime`, `i18n`, `remote-registry`,
  `ui-gcds` — plus `runtime-config`, which isn't currently named in
  CLAUDE.md's shared-libs list and should be added there) have a
  `package.json` scoped `@tn4consulting/shared-*` with
  `publishConfig.registry` pointed at GitHub Packages.
- `tools/scripts/publish-shared-lib.mjs` exists and encodes the
  dist-folder-collision workaround described in CLAUDE.md.

**Not done / outstanding:**
- [ ] No evidence any `libs/shared/*` package has actually been published to
      GitHub Packages yet (no `.npmrc` registry/auth wiring committed, which
      is expected for a secret — but also nothing confirming a real publish
      has happened, e.g. in CI). Verify against the GitHub Packages registry
      before assuming the publish pipeline works end to end, not just that
      the script exists.
- [ ] No local sibling clones of the 5 new per-app repos, and no VSCode
      multi-root workspace file exists in this repo yet — both described in
      CLAUDE.md as the intended local multi-repo dev setup.
- [ ] The 5 per-app repos are "already created" per CLAUDE.md but nothing here
      confirms code has actually been migrated into them yet (frontends,
      their `libs/<name>/feature-*`/`ui-*`, and the BFFs that move with them —
      `benefit-aggregation-bff`, `job-bank-bff`, `employment-insurance-bff`).
- [ ] No CI wiring yet for publishing a `libs/shared/*` package on version
      bump (the publish script is designed to be run, but nothing automates
      running it).
- [ ] Once apps actually move to separate repos, the composed `mfe-e2e` suite
      (today a plain Nx project in this repo) needs a real plan for how it
      still starts all 9 local processes when they no longer live in one
      workspace.

## Language support

- [ ] Add Cree and Inuktitut (`cr`/`iu`) alongside English/French. Scoped by an
      exploration pass — key points:
      - `SUPPORTED_LOCALES` in `libs/shared/i18n/src/lib/locale-sync.ts` is the
        single source of truth for the `Locale` type and is N-language-ready
        (just an array) — but several places hand-roll their own `'en' | 'fr'`
        union instead of importing `Locale`, and need manual updates:
        `libs/shared/content-client`'s `ContentClient` interface,
        `StrapiContentClient`, `StaticContentClient`, and the dashboard app's
        static content fallback map (`apps/dashboard/src/app/app.ts`).
      - The shell's language switcher (`MscaAppFrame` in
        `libs/shared/ui-gcds`) is a strict binary toggle
        (`otherLocale`/`switchLocale`), not a picker — needs to become a
        dropdown/menu for 4 languages. GCDS has no built-in multi-language
        picker to reuse (`gcds-header`'s `toggle` slot and `gcds-lang-toggle`
        are both designed for exactly one "other" language).
      - **Hard ceiling**: `@gcds-core/components` (v1.4.0) is officially
        bilingual-only. Its `assignLanguage()` util
        (`dist/collection/utils/utils.js`) collapses any non-`fr*` lang to
        `'en'`, and internal validation-error strings
        (`utils/i18n/validation-errors.js`) are a closed `{en, fr}` dictionary
        with no fallback branch. There is no supported way to get GCDS's own
        internal chrome (form validation messages, built-in ARIA text) to
        render in Cree/Inuktitut without forking/patching upstream
        (`cds-snc/gcds-components`) — check upstream GitHub issues before
        committing to that. App-level Transloco-driven content can still
        switch fully; GCDS's own internal strings can't.
      - 10 new translation files needed (`cr.json`/`iu.json` per app, matching
        the existing `apps/*/public/assets/i18n/{en,fr}.json` pairs) — the
        loader itself is generic and needs no code changes once the files
        exist and `SUPPORTED_LOCALES` is extended.
      - Strapi: `fr` locale is created in
        `tools/cms/strapi/src/index.ts`'s `ensureFrenchLocale()`
        (idempotent, runs on every `bootstrap()`). `cr`/`iu` are valid
        ISO 639-1 codes Strapi's i18n plugin should accept the same way;
        needs an equivalent `ensureCreeLocale`/`ensureInuktitutLocale` (or a
        generalized loop) plus seed-data translations in the same file.
      - `apps/shell/src/index.html`'s `<html lang="en">` is static and never
        updated on locale switch — pre-existing gap, worth fixing alongside
        this since it matters more with 4 languages than 2.
      - No `Intl.NumberFormat`/`Intl.DateTimeFormat`/Angular `LOCALE_ID`
        usage exists anywhere yet, so there's no CLDR-formatting assumption
        to fight — a genuine plus, since `cr`/`iu` lack full CLDR data.

## Naming consistency

- [ ] Rename `benefit-aggregation-bff` to `dashboard-bff` for consistency with
      the other BFFs' `<app-name>-bff` naming (`job-bank-bff`,
      `employment-insurance-bff`). Lives in the `mfe-pot-dashboard` repo today
      (`apps/benefit-aggregation-bff`) — touches that repo's `apps/` folder
      name, its `project.json`/`package.json` name fields, port/env-var
      references, `charts/` (Helm chart + any `values*.yaml`), and every
      cross-repo reference: `mfe-app/CLAUDE.md`, `mfe-app/TODO.md`,
      `mfe-app/docs/plans/mfe-pot-initial-design.md` and
      `mfe-app/docs/plans/20260801-1935-mfe-pot-polyrepo-split-and-k8s-hosting.md`,
      `mfe-app/apps/mfe-e2e/playwright.config.ts` and
      `mfe-app/apps/mfe-e2e/src/golden-path.spec.ts`, and
      `mfe-app/.vscode/launch.json`.

## Documentation

- [ ] Create a README with developer instructions (setup, tooling versions,
      running the local stack, tests) — no repo README exists yet.

## Nx build performance

Recommendations surfaced by an `nx` run performance report:

- [ ] Set up Nx Remote Cache to share build/test/lint cache across the team and
      CI, to drastically reduce run duration —
      https://nx.dev/ci/features/remote-cache
- [ ] Speed up or split the longest task on the critical path:
      `job-bank:build:production` (6.5s)

## Concept UI screens (from `docs/msca-screenshots/`)

Concept screenshots were dropped in `docs/msca-screenshots/` showing target UI for
a fuller MSCA experience. Two files are duplicates of others (different crop,
same content): `notification-settings.png` ≡ `inbox.png`, `view-my-payments.png`
≡ `dashboard.png` — ignore those two. That leaves 6 distinct concepts: dashboard,
profile, inbox, benefit-application-status, have-a-representative,
omnichannel-support. Almost none of it exists yet — `apps/dashboard` today is
just a CMS welcome blurb + a 2-row payment-history widget; the shell has no
local routes beyond the 4 federated remotes; no profile/inbox/notification UI
exists anywhere.

Decided approach: build one vertical slice at a time rather than all 6 at once.

- [ ] **Dashboard screen** (`dashboard.png`) — first slice, already planned in
      detail (new `libs/dashboard/feature-overview` lib for What's New / Needs
      Attention / Consider This, extend `feature-payment-history` with
      program/status columns + bilingual fix, wire into `apps/dashboard`). Full
      plan written to `/Users/martin/.claude/plans/lovely-wandering-engelbart.md`
      — re-derive/re-plan from that file's content if it's no longer present
      (plan files under `~/.claude/plans` aren't repo-tracked).
- [ ] Profile screen (`profile.png`) — My Profile/Preferences/Authorizations/
      Security tabs, personal/contact/family info, sidebar links (Message
      Centre, Payments History, Notifications, Document Centre). Natural owner
      is `dashboard` per the "tell us once" profile domain boundary in
      CLAUDE.md.
- [ ] Inbox screen (`inbox.png`) — message list with program/date/has-PDF
      filters. No natural app owner yet identified; likely a new shell-level
      local route (global nav concern) backed by a not-yet-built service.
- [ ] Benefit-application-status screen (`benefit-application-status.png`) —
      "My Active Programs" list (EI/CPP/CDCP status, summary, required action).
      Conceptually maps to `benefit-aggregation-bff`'s cross-benefit overview,
      which doesn't exist as code yet.
- [ ] Have-a-representative / acting-on-behalf-of flow
      (`have-a-representative.png`) — deferred, needs real design: touches
      session/identity and there's currently only a single mock persona
      (`libs/shared/auth`'s `createMockSession`). Not a UI-only mock — decide
      properly before building.
- [ ] Omnichannel support modal (`omnichannel-support.png`) — Call us / Chat
      with us / Schedule a call. Net-new, no natural owner yet identified
      (candidate: shared shell-level widget, similar pattern to
      `PAYMENT_HISTORY_WIDGET_LOADER`'s host-mediated cross-remote composition
      if multiple remotes need it).

Also noted along the way, worth its own line item:

- [ ] No `axe`/accessibility test tooling exists anywhere in the repo yet
      (no `jest-axe`, no Playwright at all), despite CLAUDE.md's non-negotiable
      "verified by automated tooling (axe)" requirement. Repo-wide gap, not
      specific to any one screen above.
