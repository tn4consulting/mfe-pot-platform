import { join } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

// Playwright runs `webServer.command` from this config file's own directory
// by default -- `nx run <project>:serve` needs to run from the workspace
// root instead (it resolves workspace-relative paths like
// tsconfig.base.json), so every entry below sets `cwd` explicitly.
const workspaceRoot = join(__dirname, '../..');

/**
 * Composed integration suite: proves the 5 apps + 4 BFFs work together as a
 * federated whole (routed navigation, cross-remote widget embedding,
 * language switching, the BFF-backed golden path, and the
 * dashboard-bff partial-failure contract). Each app's own Jest
 * suite already proves it works standalone -- see CLAUDE.md's "Independent
 * testability" section for why both layers matter and neither substitutes
 * for the other.
 *
 * `webServer` starts the whole local stack (all 9 processes) so the suite
 * is self-contained in CI; `reuseExistingServer` lets it attach to an
 * already-running stack for fast local iteration instead of restarting
 * everything.
 */
// Starting 9 `nx run` processes concurrently (one per webServer entry)
// contends for the single shared Nx daemon's SQLite task-history DB hard
// enough to crash it -- NX_DAEMON=false makes each spawned process run
// standalone instead of coordinating through that daemon.
const noDaemonEnv = { ...process.env, NX_DAEMON: 'false' };

function frontend(project: string, port: number) {
  return {
    command: `pnpm exec nx run ${project}:serve`,
    cwd: workspaceRoot,
    env: noDaemonEnv,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  };
}

function backend(project: string, port: number) {
  return {
    command: `pnpm exec nx run ${project}:serve`,
    cwd: workspaceRoot,
    env: noDaemonEnv,
    url: `http://localhost:${port}/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  };
}

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
  // employment-life-events) and 3 of the 4 BFFs (job-bank-bff,
  // employment-insurance-bff, dashboard-bff) have moved to
  // their own repos -- Phase 1 of the polyrepo split (see
  // docs/plans/20260801-1935-mfe-pot-polyrepo-split-and-k8s-hosting.md)
  // is now complete. Only client-profile-service (no single frontend
  // owner, stays in the platform repo per the plan) is left here. Phase 2
  // rewires this array to point every entry at its sibling checkout
  // (`cd ../mfe-pot-<app> && pnpm exec nx run <app>:serve`) instead of
  // deleting them one at a time as each app left -- until that happens,
  // this suite has no composed coverage at all.
  webServer: [backend('client-profile-service', 3003)],
});
