import { defineConfig, devices } from '@playwright/test';

/**
 * Composed integration suite: proves the 5 apps + 3 BFFs work together as a
 * federated whole (routed navigation, cross-remote widget embedding,
 * language switching, the BFF-backed golden path, and the
 * dashboard-bff partial-failure contract). Each app's own Jest
 * suite already proves it works standalone -- see CLAUDE.md's "Independent
 * testability" section for why both layers matter and neither substitutes
 * for the other.
 *
 * `webServer` is empty until Phase 2 (see the comment below) rewires it to
 * start every sibling repo's own processes -- until then, run this suite
 * against an already-running stack (`reuseExistingServer` picks up anything
 * already listening on the expected ports) rather than via a `frontend()`/
 * `backend()` helper here, since nothing in this repo starts anymore.
 */
export default defineConfig({
  testDir: './src',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // All 5 frontends (shell, dashboard, job-bank, employment-insurance,
  // employment-life-events) and all 3 BFFs (job-bank-bff,
  // employment-insurance-bff, dashboard-bff) have moved to their own repos
  // -- Phase 1 of the polyrepo split (see
  // docs/plans/20260801-1935-mfe-pot-polyrepo-split-and-k8s-hosting.md) is
  // now complete, and client-profile-service (the one thing that stayed
  // here) has since been removed entirely (its data folded into
  // dashboard-bff's own local stub data -- see mfe-pot-dashboard's
  // CLAUDE.md). Nothing starts from this repo anymore. Phase 2 needs to
  // point every entry at its sibling checkout
  // (`cd ../mfe-pot-<app> && pnpm exec nx run <app>:serve`) from scratch --
  // until that happens, this suite has no composed coverage at all.
  webServer: [],
});
