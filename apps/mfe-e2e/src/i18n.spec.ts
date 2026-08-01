import { expect, test } from '@playwright/test';
import { signIn } from './support/sign-in';

/**
 * Proves the cross-federation-boundary broadcast (see CLAUDE.md's i18n
 * section): switching language in the shell updates the shell's own chrome
 * AND an independently-loaded remote's chrome simultaneously, each
 * fetching its own translation files from its own origin off one
 * `window` `CustomEvent`.
 */
test('switching language updates both the shell and an embedded remote at once', async ({ page }) => {
  await signIn(page);
  await page.goto('/employment-life-events');

  await expect(page.getByRole('link', { name: /dashboard \(federated remote\)/i })).toBeVisible();
  await expect(page.getByText("you lost your job")).toBeVisible();

  await page.getByRole('button', { name: 'Français' }).click();

  await expect(page.getByRole('link', { name: /tableau de bord/i })).toBeVisible();
  await expect(page.getByText('Vous avez perdu votre emploi')).toBeVisible();
});
