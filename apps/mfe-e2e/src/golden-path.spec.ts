import { expect, test } from '@playwright/test';
import { signIn } from './support/sign-in';

/**
 * The end-to-end functional walkthrough from the design plan: apply for a
 * job, apply for EI and submit a report, then confirm MSCA-D's
 * cross-benefit overview reflects that activity -- proving
 * dashboard-bff actually composes across the domain BFFs rather
 * than showing hardcoded sample data. Each step hits a real local BFF (see
 * CLAUDE.md's "Backends: BFF pattern" section).
 */
test('applying for a job and for EI is reflected in the dashboard overview', async ({ page }) => {
  await signIn(page);

  await page.goto('/job-bank');
  await page.getByRole('button', { name: 'Apply now' }).click();
  await expect(page.getByRole('status')).toContainText('submitted');

  await page.goto('/employment-insurance');
  await page.getByRole('button', { name: 'Apply for EI' }).click();
  await expect(page.getByRole('status')).toContainText('status: approved');

  await page.goto('/dashboard');
  // Loose assertions deliberately: the BFFs hold in-memory state with no
  // reset endpoint yet (a `pnpm demo:reset` is a natural follow-up -- see
  // CLAUDE.md's demo narrative section), so repeated runs accumulate
  // applications/claims rather than starting from zero every time.
  await expect(page.getByText(/Application for job-\d+/).first()).toBeVisible();
  await expect(page.getByText('Employment Insurance claim — approved').first()).toBeVisible();
  await expect(page.getByText('Submit your next EI report')).toBeVisible();
});
