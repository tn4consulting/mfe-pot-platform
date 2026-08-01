import { StrapiContentClient } from './strapi-content-client';

describe('StrapiContentClient', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('returns the matching page content for a key/locale', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ id: 1, key: 'dashboard.overview.intro', title: 'Bienvenue', body: 'Voici...' }],
      }),
    }) as unknown as typeof fetch;

    const client = new StrapiContentClient('http://localhost:1337');
    const result = await client.getPageContent('dashboard.overview.intro', 'fr');

    expect(result).toEqual({
      key: 'dashboard.overview.intro',
      title: 'Bienvenue',
      body: 'Voici...',
    });
  });

  it('returns null when no matching entry exists', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    }) as unknown as typeof fetch;

    const client = new StrapiContentClient('http://localhost:1337');
    const result = await client.getPageContent('unknown.key', 'en');

    expect(result).toBeNull();
  });
});
