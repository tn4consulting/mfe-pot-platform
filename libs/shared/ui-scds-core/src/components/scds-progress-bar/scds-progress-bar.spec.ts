// Tests exercise the *built* dist-custom-elements output -- see
// scds-card.spec.ts's own comment for why. Run `nx build
// shared-ui-scds-core` (or `stencil build`) before running these tests.
import { defineCustomElement as defineScdsProgressBar } from '../../../dist/components/scds-progress-bar.js';
import { waitForRender } from '../../testing/wait-for-render';

describe('scds-progress-bar', () => {
  beforeAll(() => {
    defineScdsProgressBar();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function createBar(attrs: Record<string, string> = {}): Promise<HTMLElement> {
    const el = document.createElement('scds-progress-bar');
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, value);
    }
    document.body.appendChild(el);
    await waitForRender();
    return el;
  }

  it('renders progressbar ARIA attributes reflecting current/total', async () => {
    const el = await createBar({ current: '3', total: '7', 'step-label': 'Employment separation' });

    const bar = el.shadowRoot!.querySelector('.scds-progress-bar')!;
    expect(bar.getAttribute('role')).toBe('progressbar');
    expect(bar.getAttribute('aria-valuemin')).toBe('1');
    expect(bar.getAttribute('aria-valuemax')).toBe('7');
    expect(bar.getAttribute('aria-valuenow')).toBe('3');
    expect(bar.getAttribute('aria-valuetext')).toBe('Step 3 of 7: Employment separation');
  });

  it('renders visible step count and label text', async () => {
    const el = await createBar({ current: '3', total: '7', 'step-label': 'Employment separation' });

    expect(el.shadowRoot!.querySelector('.scds-progress-bar__step-count')!.textContent).toContain('Step 3 of 7');
    expect(el.shadowRoot!.querySelector('.scds-progress-bar__step-label')!.textContent).toBe(
      'Employment separation',
    );
  });

  it('sets the fill width proportionally to current/total', async () => {
    const el = await createBar({ current: '1', total: '4' });

    const fill = el.shadowRoot!.querySelector('.scds-progress-bar__fill') as HTMLElement;
    expect(fill.style.width).toBe('25%');
  });

  it('omits the step label element when none is given', async () => {
    const el = await createBar({ current: '1', total: '4' });

    expect(el.shadowRoot!.querySelector('.scds-progress-bar__step-label')).toBeFalsy();
    expect(el.shadowRoot!.querySelector('.scds-progress-bar')!.getAttribute('aria-valuetext')).toBe(
      'Step 1 of 4',
    );
  });
});
