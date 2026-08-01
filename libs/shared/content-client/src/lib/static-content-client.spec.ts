import { StaticContentClient } from './static-content-client';

describe('StaticContentClient', () => {
  const client = new StaticContentClient({
    'dashboard.overview.intro': {
      en: { key: 'dashboard.overview.intro', title: 'Welcome', body: 'Overview...' },
      fr: { key: 'dashboard.overview.intro', title: 'Bienvenue', body: 'Aperçu...' },
    },
  });

  it('returns content for a known key/locale', async () => {
    await expect(client.getPageContent('dashboard.overview.intro', 'fr')).resolves.toEqual({
      key: 'dashboard.overview.intro',
      title: 'Bienvenue',
      body: 'Aperçu...',
    });
  });

  it('returns null for an unknown key', async () => {
    await expect(client.getPageContent('unknown.key', 'en')).resolves.toBeNull();
  });
});
