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
 * benefit-aggregation-bff partial-failure contract). Each app's own Jest
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
  webServer: [
    backend('job-bank-bff', 3001),
    backend('employment-insurance-bff', 3002),
    backend('client-profile-service', 3003),
    backend('benefit-aggregation-bff', 3004),
    frontend('shell', 4200),
    frontend('dashboard', 4201),
    frontend('employment-life-events', 4202),
    frontend('job-bank', 4203),
    frontend('employment-insurance', 4204),
  ],
});
