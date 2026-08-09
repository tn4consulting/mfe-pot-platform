# mfe-pot platform standards

This file is generated — copied here by `sync-platform-standards` (part of
`@tn4consulting/shared-platform-standards`, run automatically on
`pnpm install`) so it's a real, always-available file even in a repo
checked out on its own, with no `mfe-pot-platform` sibling present. Don't
edit this copy directly; it's overwritten on every install. The source
lives in `mfe-pot-platform/libs/shared/platform-standards/standards/PLATFORM_STANDARDS.md`.

This is the **compact, enforceable subset** of the family's standards —
requirements every team's code (and every Claude session working in this
repo) must follow, not the deep architecture rationale. For the "why" and
every gotcha behind these rules, see `mfe-pot-platform/CLAUDE.md` directly
if you have that repo checked out as a sibling; nothing here duplicates
its detail on purpose.

## Non-negotiable requirements

- **Bilingual**: English and Canadian French everywhere a citizen sees it —
  UI chrome and CMS content both.
- **Accessibility**: WCAG 2.2 AA, verified by automated tooling (axe), not
  just manual review.
- **SCDS** (`@tn4consulting/shared-ui-scds-core`) for all UI. Never GCDS —
  it was removed from the family entirely.
- **React**, **TypeScript everywhere** — every frontend and every
  BFF/service app.
- **Unit tests (Jest) and integration tests (Playwright)** are required,
  run locally against stubs/emulators only — no dependency on real
  external services for tests.
- Each MFE is **independently buildable, testable, and deployable**, and
  is **loaded dynamically at runtime** as a federated remote — never
  compiled into the shell at build time.

## Federation-sharing policy

Default to **not** marking a library as a federation "shared" singleton —
every shared entry re-couples deploy/version schedules across repos, the
opposite of the independence the split is for. Today's bar is met only by:
`react`/`react-dom` (large, stable, low-churn), `@tn4consulting/shared-ui-scds-core`
(same, plus every remote renders its custom elements directly), and
`@tn4consulting/shared-federation-runtime` (not stable/low-churn, but its
React Context objects need identical object identity across every
provider/consumer, or `useContext` silently resolves to `undefined` with
no error). It is **not** met by feature/business-logic code or anything
with active churn. Weigh any new sharing candidate against this same bar —
don't add one without a specific reason it clears it.

**This is the single highest-risk failure mode for a multi-team family**:
a version mismatch on a shared singleton fails at runtime with no
compile-time warning across repos. `check-platform-versions` (this same
package) enforces this — run `pnpm run check:versions` before assuming a
dependency bump is safe.

## Strong contracts between split repos

- `libs/shared/*` in `mfe-pot-platform` ships as versioned
  `@tn4consulting/shared-<name>` packages via GitHub Packages — a breaking
  change requires a major bump; a consumer that hasn't updated simply fails
  to build. That's the enforcement mechanism, not a convention to remember.
- `platform-versions.json` (in `mfe-pot-platform`) is the single source of
  truth for the Node/pnpm/TypeScript/React/SCDS versions every app repo
  must stay aligned on.
- Naming convention: the two host ("shell") apps get plain brand names;
  every internally-federated remote gets an `-mfe` suffix across its
  repo/directory name, Nx project name, federation identity, Docker image,
  and Helm chart/release/Ingress host — so a shell's own front-door
  hostname and the remote it composes never read as one hyphen apart.

## BFF boundary rules

- UI apps and libraries may call **only their own BFF** — never another
  domain's BFF or a backend service directly.
- BFFs must **not** call each other, but they may call backend services.
- Shared state (session) is managed cross-application via Redis
  (`@tn4consulting/shared-session-cache`), not ad hoc per-BFF state.
- Enforced by `check-bff-boundaries` (this same package) — run
  `pnpm run check:boundaries` before assuming a new cross-domain call is
  safe. Not a full data-flow analysis (see the script's own header
  comment); catches the concrete violation shape found and fixed in
  `dashboard-bff`'s former `getBenefitOverview` fan-out, not every
  conceivable one.

## Linting

Follow lint rules — don't suppress them to get past a check. A failing
rule means fix the code, or, if the rule is genuinely wrong for a case,
change the rule deliberately with a stated reason — not an inline disable
comment left unexplained.
