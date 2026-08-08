// Tests exercise the *built* dist-custom-elements output (a real custom
// element, real shadow DOM) rather than the raw .tsx source -- see
// scds-card.spec.ts's own comment for why. Run `nx build
// shared-ui-scds-core` (or `stencil build`) before running these tests.
import { defineCustomElement as defineScdsTextInput } from '../../../dist/components/scds-text-input.js';
import { waitForRender } from '../../testing/wait-for-render';

describe('scds-text-input', () => {
  beforeAll(() => {
    defineScdsTextInput();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function createInput(attrs: Record<string, string> = {}): Promise<HTMLElement> {
    const el = document.createElement('scds-text-input');
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, value);
    }
    document.body.appendChild(el);
    await waitForRender();
    return el;
  }

  it('renders a labeled input linked via htmlFor/id', async () => {
    const el = await createInput({ label: 'First name' });

    const label = el.shadowRoot!.querySelector('label')!;
    const input = el.shadowRoot!.querySelector('input')!;
    expect(label.textContent).toContain('First name');
    expect(label.getAttribute('for')).toBe(input.id);
  });

  it('reflects the value attribute onto the input', async () => {
    const el = await createInput({ label: 'First name', value: 'Jordan' });

    expect(el.shadowRoot!.querySelector('input')!.value).toBe('Jordan');
  });

  it('marks the input required and shows a visible required indicator', async () => {
    const el = await createInput({ label: 'First name', required: 'true' });

    expect(el.shadowRoot!.querySelector('input')!.required).toBe(true);
    expect(el.shadowRoot!.querySelector('.scds-text-input__required')).toBeTruthy();
  });

  it('wires an error message via aria-describedby and aria-invalid', async () => {
    const el = await createInput({ label: 'First name', error: 'First name is required.' });

    const input = el.shadowRoot!.querySelector('input')!;
    const error = el.shadowRoot!.querySelector('.scds-text-input__error')!;
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(error.id);
    expect(error.textContent).toContain('First name is required.');
  });

  it('emits scdsInput on keystroke and scdsChange on native change', async () => {
    const el = await createInput({ label: 'First name' });
    const input = el.shadowRoot!.querySelector('input')!;
    const inputSpy = jest.fn();
    const changeSpy = jest.fn();
    el.addEventListener('scdsInput', (event) => inputSpy((event as CustomEvent<string>).detail));
    el.addEventListener('scdsChange', (event) => changeSpy((event as CustomEvent<string>).detail));

    input.value = 'Jordan';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('change'));

    expect(inputSpy).toHaveBeenCalledWith('Jordan');
    expect(changeSpy).toHaveBeenCalledWith('Jordan');
  });
});
