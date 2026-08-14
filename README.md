# mfe-pot-platform

> **Disclaimer:** This is an independent proof-of-technology project, not
> affiliated with, endorsed by, or associated with Service Canada,
> Employment and Social Development Canada (ESDC), or the Government of
> Canada in any way. "MSCA" and any GC branding/design-system references are
> used only to ground the proof of technology in a realistic scenario.

The platform repo of the mfe-pot family — home to `libs/shared/*`, the
composed `mfe-e2e` suite, Strapi, and the two Helm library charts. For
architecture, rationale, and gotchas, see [`CLAUDE.md`](./CLAUDE.md) (this
repo) and [`../CLAUDE.md`](../CLAUDE.md) (the repo map one level up).

If you only care about one app in isolation, see that app's own README
instead (`mfe-pot-msca-shell/README.md`, `mfe-pot-dashboard-mfe/README.md`,
etc.) — each is independently buildable/testable/servable on its own.

## Setup guides

- **[`docs/developer-setup.md`](./docs/developer-setup.md)** — getting a dev
  machine ready to work in this repo: editor, toolchain, lint/test/build
  loop. Start here.
- **[`docs/local-setup.md`](./docs/local-setup.md)** — running the *whole
  mfe-pot family* together on a local `kind` cluster (kind/Helm-based, not
  `nx serve`), including Strapi, iterating on one app, and testing tiers.
- **[`docs/eks-setup.md`](./docs/eks-setup.md)** — hosting the family on AWS
  EKS for a live demo.

## Where to go next

- [`CLAUDE.md`](./CLAUDE.md) — full architecture, every non-obvious gotcha,
  and the rationale behind every decision in this repo.
- [`../CLAUDE.md`](../CLAUDE.md) — the 7-repo map and cross-repo mechanics.
- [`../TODO.md`](../TODO.md) — outstanding work across the whole family.
