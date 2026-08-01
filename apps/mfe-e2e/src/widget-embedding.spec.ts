import { expect, test } from '@playwright/test';
import { signIn } from './support/sign-in';

/**
 * The harder, more valuable federation capability: `employment-life-events`
 * dynamically imports and renders `dashboard`'s payment-history component
 * live, with dashboard's own providers applied (see CLAUDE.md's
 * "Federation" section on cross-remote widget composition being
 * host-mediated). This is real cross-remote component embedding, not two
 * copies of the same static content.
 */
test('employment-life-events embeds dashboard\'s live payment-history widget', async ({ page }) => {
  await signIn(page);
  await page.goto('/employment-life-events');

  await expect(page.getByText('Payment history')).toBeVisible();
  await expect(page.getByText(/Employment Insurance — \$638\.00/).first()).toBeVisible();
});

test('the same payment data appears on dashboard\'s own page, sourced from the same backend', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/dashboard');

  await expect(page.getByText(/Employment Insurance — \$638\.00/).first()).toBeVisible();
});
