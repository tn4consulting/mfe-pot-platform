// See scds-card.spec.ts's own comment for why this tests the *built*
// dist-custom-elements output rather than the raw .tsx source. Run `nx
// build shared-ui-scds-core` (or `stencil build`) before running these
// tests.
import { defineCustomElement as defineScdsChecklist } from '../../../dist/components/scds-checklist.js';
import { defineCustomElement as defineScdsChecklistItem } from '../../../dist/components/scds-checklist-item.js';
import { defineCustomElement as defineScdsHeading } from '../../../dist/components/scds-heading.js';
import { waitForRender } from '../../testing/wait-for-render';

describe('scds-checklist', () => {
  beforeAll(() => {
    defineScdsChecklist();
    defineScdsChecklistItem();
    defineScdsHeading();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function createChecklist(attrs: Record<string, string> = {}, innerHtml = ''): Promise<HTMLElement> {
    const el = document.createElement('scds-checklist');
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, value);
    }
    el.innerHTML = innerHtml;
    document.body.appendChild(el);
    await waitForRender();
    return el;
  }

  it('renders a heading when checklist-heading is set', async () => {
    const el = await createChecklist({ 'checklist-heading': 'Steps to take when you leave your job' });

    const heading = el.shadowRoot!.querySelector('scds-heading');
    expect(heading).toBeTruthy();
    expect(heading!.textContent).toContain('Steps to take when you leave your job');
  });

  it('renders no heading, and applies list-label to the role="list" element, when checklist-heading is omitted', async () => {
    const el = await createChecklist({ 'list-label': 'Departure checklist' });

    expect(el.shadowRoot!.querySelector('scds-heading')).toBeFalsy();
    const list = el.shadowRoot!.querySelector('[role="list"]');
    expect(list!.getAttribute('aria-label')).toBe('Departure checklist');
  });

  it('projects scds-checklist-item children into the role="list" element', async () => {
    const el = await createChecklist({}, '<scds-checklist-item item-title="Get your ROE"></scds-checklist-item>');
    await waitForRender();

    expect(el.querySelector('scds-checklist-item')).toBeTruthy();
    expect(el.shadowRoot!.querySelector('[role="list"] slot')).toBeTruthy();
  });
});
