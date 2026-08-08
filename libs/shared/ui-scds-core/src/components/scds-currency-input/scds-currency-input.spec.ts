// Tests exercise the *built* dist-custom-elements output -- see
// scds-card.spec.ts's own comment for why. Run `nx build
// shared-ui-scds-core` (or `stencil build`) before running these tests.
import { defineCustomElement as defineScdsCurrencyInput } from '../../../dist/components/scds-currency-input.js';
import { waitForRender } from '../../testing/wait-for-render';

describe('scds-currency-input', () => {
  beforeAll(() => {
    defineScdsCurrencyInput();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function createInput(attrs: Record<string, string> = {}): Promise<HTMLElement> {
    const el = document.createElement('scds-currency-input');
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, value);
    }
    document.body.appendChild(el);
    await waitForRender();
    return el;
  }

  it('formats an initial numeric value to 2 decimals with a $ prefix', async () => {
    const el = await createInput({ label: 'Rate of pay', value: '18' });

    expect(el.shadowRoot!.querySelector('input')!.value).toBe('18.00');
    expect(el.shadowRoot!.querySelector('.scds-currency-input__symbol')!.textContent).toBe('$');
  });

  it('reformats and emits a numeric scdsChange on blur', async () => {
    const el = await createInput({ label: 'Rate of pay' });
    const input = el.shadowRoot!.querySelector('input')!;
    const spy = jest.fn();
    el.addEventListener('scdsChange', (event) => spy((event as CustomEvent<number | null>).detail));

    input.value = '18.5';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    await waitForRender();

    expect(spy).toHaveBeenCalledWith(18.5);
    expect(input.value).toBe('18.50');
  });

  it('emits null on blur when the field is empty', async () => {
    const el = await createInput({ label: 'Rate of pay' });
    const input = el.shadowRoot!.querySelector('input')!;
    const spy = jest.fn();
    el.addEventListener('scdsChange', (event) => spy((event as CustomEvent<number | null>).detail));

    input.dispatchEvent(new Event('blur'));

    expect(spy).toHaveBeenCalledWith(null);
  });

  it('clamps to max on blur', async () => {
    const el = await createInput({ label: 'Rate of pay', max: '100' });
    const input = el.shadowRoot!.querySelector('input')!;
    const spy = jest.fn();
    el.addEventListener('scdsChange', (event) => spy((event as CustomEvent<number | null>).detail));

    input.value = '250';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    await waitForRender();

    expect(spy).toHaveBeenCalledWith(100);
    expect(input.value).toBe('100.00');
  });

  it('wires an error message via aria-describedby and aria-invalid', async () => {
    const el = await createInput({ label: 'Rate of pay', error: 'Rate of pay is required.' });

    const input = el.shadowRoot!.querySelector('input')!;
    const error = el.shadowRoot!.querySelector('.scds-currency-input__error')!;
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(error.id);
  });
});
