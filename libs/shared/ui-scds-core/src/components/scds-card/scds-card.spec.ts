// Tests exercise the *built* dist-custom-elements output (a real custom
// element, real shadow DOM) rather than the raw .tsx source -- Stencil's
// @Component/@Prop/@Event decorators are inert without Stencil's own
// compiler processing them, so this is the only way to test the actual
// rendered behaviour. Run `nx build shared-ui-scds-core` (or `stencil
// build`) before running these tests.
import { defineCustomElement as defineScdsCard } from '../../../dist/components/scds-card.js';
import { defineCustomElement as defineScdsBadge } from '../../../dist/components/scds-badge.js';
import { defineCustomElement as defineScdsHeading } from '../../../dist/components/scds-heading.js';
import { defineCustomElement as defineScdsText } from '../../../dist/components/scds-text.js';
import { defineCustomElement as defineScdsIcon } from '../../../dist/components/scds-icon.js';
import { waitForRender } from '../../testing/wait-for-render';

describe('scds-card', () => {
  beforeAll(() => {
    defineScdsCard();
    defineScdsBadge();
    defineScdsHeading();
    defineScdsText();
    defineScdsIcon();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function createCard(attrs: Record<string, string> = {}, innerHtml = ''): Promise<HTMLElement> {
    const el = document.createElement('scds-card');
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, value);
    }
    el.innerHTML = innerHtml;
    document.body.appendChild(el);
    await waitForRender();
    return el;
  }

  it('renders a real link in link mode', async () => {
    const el = await createCard({ 'card-title': 'Test card', href: '/somewhere' });

    const link = el.shadowRoot!.querySelector('a.scds-card--link');
    expect(link).toBeTruthy();
    expect(link!.getAttribute('href')).toBe('/somewhere');
    expect(link!.textContent).toContain('Test card');
  });

  it('renders a non-link static card when href is absent', async () => {
    const el = await createCard({ 'card-title': 'Test card' });

    expect(el.shadowRoot!.querySelector('a.scds-card--link')).toBeFalsy();
    const staticCard = el.shadowRoot!.querySelector('.scds-card--static');
    expect(staticCard).toBeTruthy();
    expect(staticCard!.textContent).toContain('Test card');
  });

  it('renders a tone badge with the tone label when tone is set', async () => {
    const el = await createCard({ 'card-title': 'Test card', tone: 'warning', 'tone-label': 'Warning' });
    await waitForRender();

    // tone/label are reflect:false props on scds-badge -- per this
    // codebase's documented gotcha (see platform CLAUDE.md's "GC Design
    // System" section), getAttribute() won't show a reflect:false prop's
    // value even though it rendered correctly, so check the live JS
    // property instead.
    const badge = el.shadowRoot!.querySelector('scds-badge') as (HTMLElement & { tone?: string; label?: string }) | null;
    expect(badge).toBeTruthy();
    expect(badge!.tone).toBe('warning');
    expect(badge!.label).toBe('Warning');
  });

  it('renders no badge when tone is not set', async () => {
    const el = await createCard({ 'card-title': 'Test card' });

    expect(el.shadowRoot!.querySelector('scds-badge')).toBeFalsy();
  });

  it('projects scdsCardActions content in static mode', async () => {
    const el = await createCard(
      { 'card-title': 'Test card' },
      '<div slot="scdsCardActions"><button class="action">Action</button></div>',
    );

    expect(el.querySelector('.action')).toBeTruthy();
    expect(el.shadowRoot!.querySelector('slot[name="scdsCardActions"]')).toBeTruthy();
  });

  it('projects scdsCardActions content in link mode', async () => {
    const el = await createCard(
      { 'card-title': 'Test card', href: '/somewhere' },
      '<div slot="scdsCardActions"><button class="action">Action</button></div>',
    );

    expect(el.querySelector('.action')).toBeTruthy();
  });

  it('emits scdsClick with the href when the card link is clicked', async () => {
    const el = await createCard({ 'card-title': 'Test card', href: '/somewhere' });
    const handler = jest.fn();
    el.addEventListener('scdsClick', handler);

    const link = el.shadowRoot!.querySelector('a.scds-card--link')!;
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(handler).toHaveBeenCalledTimes(1);
    expect((handler.mock.calls[0][0] as CustomEvent).detail).toBe('/somewhere');
  });
});
