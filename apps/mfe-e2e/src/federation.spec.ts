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

  test('shell loads life-events-mfe as a federated remote', async ({ page }) => {
    await page.goto('/life-events/job-loss');
    await expect(page.getByText("you lost your job")).toBeVisible();
  });

  test('life-events-mfe renders a different life event by route param, from the same remote', async ({ page }) => {
    await page.goto('/life-events/birth');
    await expect(page.getByText('you had a baby')).toBeVisible();
  });

  test('life-events hub page presents both life-event and conventional benefit entry points', async ({ page }) => {
    await page.goto('/life-events');
    await expect(page.getByRole('link', { name: /you lost your job/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();

    await page.getByRole('link', { name: /you lost your job/i }).click();
    await expect(page).toHaveURL('/life-events/job-loss');
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
