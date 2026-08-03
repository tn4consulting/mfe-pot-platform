// Tests exercise the *built* dist-custom-elements output (a real custom
// element, real shadow DOM) rather than the raw .tsx source -- Stencil's
// @Component/@Prop/@Event decorators are inert without Stencil's own
// compiler processing them, so this is the only way to test the actual
// rendered behaviour. Run `nx build shared-ui-scds-core` (or `stencil
// build`) before running these tests.
import { defineCustomElement } from '../../../dist/components/scds-card.js';
import { waitForRender } from '../../testing/wait-for-render';

describe('scds-card', () => {
  beforeAll(() => {
    defineCustomElement();
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

  it('renders a real gcds-card in link mode', async () => {
    const el = await createCard({ 'card-title': 'Test card', href: '/somewhere' });

    const gcdsCard = el.shadowRoot!.querySelector('gcds-card');
    expect(gcdsCard).toBeTruthy();
    expect(gcdsCard!.getAttribute('card-title')).toBe('Test card');
  });

  it('renders its own non-empty static markup when href is absent', async () => {
    const el = await createCard({ 'card-title': 'Test card' });

    expect(el.shadowRoot!.querySelector('gcds-card')).toBeFalsy();
    const staticCard = el.shadowRoot!.querySelector('.scds-card--static');
    expect(staticCard).toBeTruthy();
    expect(staticCard!.textContent).toContain('Test card');
  });

  it('renders a tone badge with the tone label when tone is set', async () => {
    const el = await createCard({ 'card-title': 'Test card', tone: 'warning', 'tone-label': 'Warning' });

    const badge = el.shadowRoot!.querySelector('.scds-card__badge--warning');
    expect(badge).toBeTruthy();
    expect(badge!.textContent).toContain('Warning');
  });

  it('renders no badge when tone is not set', async () => {
    const el = await createCard({ 'card-title': 'Test card' });

    expect(el.shadowRoot!.querySelector('.scds-card__badge')).toBeFalsy();
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

  it('emits scdsClick with the href when gcds-card emits gcdsClick', async () => {
    const el = await createCard({ 'card-title': 'Test card', href: '/somewhere' });
    const handler = jest.fn();
    el.addEventListener('scdsClick', handler);

    const gcdsCard = el.shadowRoot!.querySelector('gcds-card')!;
    gcdsCard.dispatchEvent(new CustomEvent('gcdsClick', { detail: '/somewhere' }));

    expect(handler).toHaveBeenCalledTimes(1);
    expect((handler.mock.calls[0][0] as CustomEvent).detail).toBe('/somewhere');
  });
});
