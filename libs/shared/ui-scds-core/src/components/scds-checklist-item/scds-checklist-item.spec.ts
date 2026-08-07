// Tests exercise the *built* dist-custom-elements output (a real custom
// element, real shadow DOM) rather than the raw .tsx source -- see
// scds-card.spec.ts's own comment for why. Run `nx build
// shared-ui-scds-core` (or `stencil build`) before running these tests.
import { defineCustomElement as defineScdsChecklistItem } from '../../../dist/components/scds-checklist-item.js';
import { defineCustomElement as defineScdsIcon } from '../../../dist/components/scds-icon.js';
import { waitForRender } from '../../testing/wait-for-render';

describe('scds-checklist-item', () => {
  beforeAll(() => {
    defineScdsChecklistItem();
    defineScdsIcon();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function createItem(attrs: Record<string, string> = {}, innerHtml = ''): Promise<HTMLElement> {
    const el = document.createElement('scds-checklist-item');
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, value);
    }
    el.innerHTML = innerHtml;
    document.body.appendChild(el);
    await waitForRender();
    return el;
  }

  it('renders the title and description with an empty (incomplete) marker by default', async () => {
    const el = await createItem({ 'item-title': 'Get your ROE', description: 'Ask your employer.' });

    expect(el.shadowRoot!.querySelector('.scds-checklist-item__title')!.textContent).toContain('Get your ROE');
    expect(el.shadowRoot!.querySelector('.scds-checklist-item__description')!.textContent).toContain(
      'Ask your employer.',
    );
    expect(el.shadowRoot!.querySelector('.scds-checklist-item__marker-empty')).toBeTruthy();
    expect(el.shadowRoot!.querySelector('scds-icon')).toBeFalsy();
  });

  it('renders a check-circle icon marker and an accessible completion label when complete', async () => {
    const el = await createItem({
      'item-title': 'Get your ROE',
      complete: 'true',
      'complete-label': 'Completed',
    });
    await waitForRender();

    const icon = el.shadowRoot!.querySelector('scds-icon') as (HTMLElement & { name?: string }) | null;
    expect(icon).toBeTruthy();
    expect(icon!.name).toBe('check-circle');
    expect(el.shadowRoot!.querySelector('.scds-checklist-item__marker-empty')).toBeFalsy();
    expect(el.shadowRoot!.querySelector('.scds-checklist-item__visually-hidden')!.textContent).toContain(
      'Completed',
    );
  });

  it('omits the description paragraph when none is given', async () => {
    const el = await createItem({ 'item-title': 'Get your ROE' });

    expect(el.shadowRoot!.querySelector('.scds-checklist-item__description')).toBeFalsy();
  });

  it('projects default-slot content (the action/status control)', async () => {
    const el = await createItem({ 'item-title': 'Search Job Bank' }, '<a class="action" href="/job-bank">Search</a>');

    expect(el.querySelector('.action')).toBeTruthy();
    expect(el.shadowRoot!.querySelector('slot')).toBeTruthy();
  });
});
