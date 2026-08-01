import { expect, test } from '@playwright/test';
import { signIn } from './support/sign-in';

/**
 * Proves the core federation claim: the shell dynamically loads each
 * remote's routed module at runtime (never bundled into the shell's own
 * build) -- see CLAUDE.md's "Federation" section. Each remote's dev server
 * is a genuinely separate process on a separate port (started by
 * playwright.config.ts's `webServer` array), so this is real federation,
 * not a simulation.
 */
test.describe('federation: routed remotes', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('shell loads dashboard as a federated remote', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('h1')).toContainText('MSCA-D');
    await expect(page.getByText('served from the dashboard remote')).toBeVisible();
  });

  test('shell loads job-bank as a federated remote', async ({ page }) => {
    await page.goto('/job-bank');
    await expect(page.locator('h1')).toContainText('Job Bank');
    await expect(page.getByText('Warehouse Associate').first()).toBeVisible();
  });

  test('shell loads employment-insurance as a federated remote', async ({ page }) => {
    await page.goto('/employment-insurance');
    await expect(page.locator('h1')).toContainText('Employment Insurance');
  });

  test('shell loads employment-life-events as a federated remote', async ({ page }) => {
    await page.goto('/employment-life-events');
    await expect(page.getByText("you lost your job")).toBeVisible();
  });

  test('deep-linking to a remote route without a session redirects to login', async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await page.evaluate(() => sessionStorage.clear());
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/');
  });
});
