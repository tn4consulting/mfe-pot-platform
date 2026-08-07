/**
 * WCAG 2.2 AA stays non-negotiable even with GCDS (and its own token/
 * contrast work) removed -- this asserts every real text/background token
 * pair scds-* components actually render clears the AA contrast floor, so
 * a future token edit fails CI immediately instead of waiting for the
 * end-to-end axe scan in apps/mfe-e2e to catch it later.
 *
 * Hex values here are hand-copied from tokens.css -- if you change a color
 * there, update the matching pair here (there's no build-time link between
 * the two, deliberately: this test is meant to make a silent contrast
 * regression loud, not to be a passthrough that always agrees with
 * whatever's in the CSS).
 */
const AA_NORMAL_TEXT_MIN = 4.5;
const AA_LARGE_TEXT_MIN = 3;

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16)) as [number, number, number];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const channel = c / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hexToRgb(hex1));
  const l2 = relativeLuminance(hexToRgb(hex2));
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

describe('SCDS token contrast (WCAG 2.2 AA)', () => {
  describe.each([
    ['status-info', '#cff4fc', '#055160'],
    ['status-success', '#d1e7dd', '#0f5132'],
    ['status-warning', '#fff3cd', '#664d03'],
    ['status-danger', '#f8d7da', '#842029'],
    ['status-neutral', '#e2e3e5', '#41464b'],
    ['brand-link-on-white', '#ffffff', '#1b4e8f'],
    ['text-on-white', '#ffffff', '#1c2024'],
    ['text-muted-on-white', '#ffffff', '#6b7280'],
  ])('%s (normal text, >=4.5:1)', (_name, bg, fg) => {
    it(`contrast ratio for ${bg}/${fg} meets AA`, () => {
      expect(contrastRatio(bg, fg)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT_MIN);
    });
  });

  describe.each([
    ['white-on-navy-footer', '#26374a', '#ffffff'],
    ['heading-on-white', '#ffffff', '#1c2024'],
  ])('%s (large text/UI, >=3:1)', (_name, bg, fg) => {
    it(`contrast ratio for ${bg}/${fg} meets AA large-text floor`, () => {
      expect(contrastRatio(bg, fg)).toBeGreaterThanOrEqual(AA_LARGE_TEXT_MIN);
    });
  });
});
