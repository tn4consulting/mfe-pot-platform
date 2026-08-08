// Tests exercise the *built* dist-custom-elements output -- see
// scds-card.spec.ts's own comment for why. Run `nx build
// shared-ui-scds-core` (or `stencil build`) before running these tests.
import { defineCustomElement as defineScdsPicker } from '../../../dist/components/scds-picker.js';
import { defineCustomElement as defineScdsPickerOption } from '../../../dist/components/scds-picker-option.js';
import { waitForRender } from '../../testing/wait-for-render';

describe('scds-picker', () => {
  beforeAll(() => {
    defineScdsPicker();
    defineScdsPickerOption();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function createPicker(
    attrs: Record<string, string> = {},
    options: Array<{ value: string; label: string }> = [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  ): Promise<HTMLElement> {
    const el = document.createElement('scds-picker');
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, value);
    }
    for (const option of options) {
      const optionEl = document.createElement('scds-picker-option');
      optionEl.setAttribute('value', option.value);
      optionEl.textContent = option.label;
      el.appendChild(optionEl);
    }
    document.body.appendChild(el);
    await waitForRender();
    return el;
  }

  it('renders a radio group by default with each option as a labeled radio', async () => {
    const el = await createPicker({ label: 'Available immediately?' });

    const legend = el.shadowRoot!.querySelector('legend')!;
    expect(legend.textContent).toContain('Available immediately?');
    const radios = el.shadowRoot!.querySelectorAll('input[type="radio"]');
    expect(radios.length).toBe(2);
    expect(el.shadowRoot!.textContent).toContain('Yes');
    expect(el.shadowRoot!.textContent).toContain('No');
  });

  it('checks the radio matching the value attribute', async () => {
    const el = await createPicker({ label: 'Available immediately?', value: 'no' });

    const checked = el.shadowRoot!.querySelector('input[type="radio"]:checked') as HTMLInputElement;
    expect(checked.value).toBe('no');
  });

  it('emits scdsChange with the selected value when a radio is chosen', async () => {
    const el = await createPicker({ label: 'Available immediately?' });
    const spy = jest.fn();
    el.addEventListener('scdsChange', (event) => spy((event as CustomEvent<string>).detail));

    const radios = el.shadowRoot!.querySelectorAll('input[type="radio"]') as NodeListOf<HTMLInputElement>;
    radios[1].click();

    expect(spy).toHaveBeenCalledWith('no');
  });

  it('renders a native select with a placeholder when display="select"', async () => {
    const el = await createPicker(
      { label: 'Highest level of education', display: 'select' },
      [
        { value: 'high_school', label: 'High school' },
        { value: 'college_trade', label: 'College or trade' },
      ],
    );

    const select = el.shadowRoot!.querySelector('select')!;
    expect(select).toBeTruthy();
    expect(select.querySelectorAll('option').length).toBe(3); // placeholder + 2 real options
  });

  it('emits scdsChange with the selected value for the select display', async () => {
    const el = await createPicker({ label: 'Highest level of education', display: 'select' });
    const spy = jest.fn();
    el.addEventListener('scdsChange', (event) => spy((event as CustomEvent<string>).detail));

    const select = el.shadowRoot!.querySelector('select') as HTMLSelectElement;
    select.value = 'no';
    select.dispatchEvent(new Event('change'));

    expect(spy).toHaveBeenCalledWith('no');
  });

  it('hides its scds-picker-option children directly (defense in depth beyond shadow-DOM slot swallowing)', async () => {
    const el = await createPicker({ label: 'Available immediately?' });

    const option = el.querySelector('scds-picker-option') as HTMLElement;
    expect(option.style.display).toBe('none');
  });

  it('wires an error message via aria-describedby on the fieldset', async () => {
    const el = await createPicker({ label: 'Available immediately?', error: 'This field is required.' });

    const fieldset = el.shadowRoot!.querySelector('fieldset')!;
    const error = el.shadowRoot!.querySelector('.scds-picker__error')!;
    expect(fieldset.getAttribute('aria-describedby')).toBe(error.id);
  });
});
