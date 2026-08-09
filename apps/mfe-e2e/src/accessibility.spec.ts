import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { signIn } from './support/sign-in';

/**
 * WCAG 2.2 AA, verified by automated tooling, not just documentation or
 * manual review -- see CLAUDE.md's "Non-negotiable requirements". Runs
 * against the real composed app (shell + federated remotes), since that's
 * what a citizen actually sees.
 */
const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

test.describe('accessibility (WCAG 2.2 AA)', () => {
  test('login page has no violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
    expect(results.violations).toEqual([]);
  });

  test('dashboard has no violations', async ({ page }) => {
    await signIn(page);
    await page.goto('/dashboard');
    const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
    expect(results.violations).toEqual([]);
  });

  test('job-bank has no violations', async ({ page }) => {
    await signIn(page);
    await page.goto('/job-bank');
    const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
    expect(results.violations).toEqual([]);
  });

  test('employment-insurance has no violations', async ({ page }) => {
    await signIn(page);
    await page.goto('/employment-insurance');
    const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
    expect(results.violations).toEqual([]);
  });

  test('life-events hub page has no violations', async ({ page }) => {
    await signIn(page);
    await page.goto('/life-events');
    const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
    expect(results.violations).toEqual([]);
  });

  test('life-events/job-loss has no violations', async ({ page }) => {
    await signIn(page);
    await page.goto('/life-events/job-loss');
    const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
    expect(results.violations).toEqual([]);
  });

  test('life-events/birth has no violations', async ({ page }) => {
    await signIn(page);
    await page.goto('/life-events/birth');
    const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
    expect(results.violations).toEqual([]);
  });

  test('life-events/disability has no violations', async ({ page }) => {
    await signIn(page);
    await page.goto('/life-events/disability');
    const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
    expect(results.violations).toEqual([]);
  });
});
