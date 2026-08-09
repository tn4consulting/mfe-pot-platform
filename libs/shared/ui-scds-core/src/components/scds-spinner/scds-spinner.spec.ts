// Tests exercise the *built* dist-custom-elements output -- see
// scds-card.spec.ts's own comment for why. Run `nx build
// shared-ui-scds-core` (or `stencil build`) before running these tests.
import { defineCustomElement as defineScdsSpinner } from '../../../dist/components/scds-spinner.js';
import { waitForRender } from '../../testing/wait-for-render';

describe('scds-spinner', () => {
  beforeAll(() => {
    defineScdsSpinner();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function createSpinner(attrs: Record<string, string> = {}): Promise<HTMLElement> {
    const el = document.createElement('scds-spinner');
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, value);
    }
    document.body.appendChild(el);
    await waitForRender();
    return el;
  }

  it('renders a status role for assistive tech to announce', async () => {
    const el = await createSpinner();

    expect(el.shadowRoot!.querySelector('.scds-spinner')!.getAttribute('role')).toBe('status');
  });

  it('defaults the label to "Loading" when none is given', async () => {
    const el = await createSpinner();

    expect(el.shadowRoot!.querySelector('.scds-spinner__label')!.textContent).toBe('Loading');
  });

  it('renders the given label as visible text', async () => {
    const el = await createSpinner({ label: 'Loading your dashboard' });

    expect(el.shadowRoot!.querySelector('.scds-spinner__label')!.textContent).toBe('Loading your dashboard');
  });

  it('applies the small-size class when size="small"', async () => {
    const el = await createSpinner({ size: 'small' });

    expect(el.shadowRoot!.querySelector('.scds-spinner')!.classList.contains('scds-spinner--small')).toBe(true);
  });

  it('defaults to the regular size', async () => {
    const el = await createSpinner();

    expect(el.shadowRoot!.querySelector('.scds-spinner')!.classList.contains('scds-spinner--regular')).toBe(true);
  });
});
