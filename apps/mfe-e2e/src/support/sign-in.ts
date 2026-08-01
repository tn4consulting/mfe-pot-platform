import { Page } from '@playwright/test';

/** Drives the shell's mock Sign-In-Canada-style login (see CLAUDE.md). */
export async function signIn(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard');
}
