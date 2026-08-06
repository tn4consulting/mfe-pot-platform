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

  it('fetches multiple keys in one request, keyed by key', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { id: 1, key: 'dashboard.payment-history.heading', title: 'Payment history', body: '' },
          { id: 2, key: 'dashboard.payment-history.table.program', title: 'Program', body: '' },
        ],
      }),
    }) as unknown as typeof fetch;
    global.fetch = fetchMock;

    const client = new StrapiContentClient('http://localhost:1337');
    const result = await client.getPageContents(
      ['dashboard.payment-history.heading', 'dashboard.payment-history.table.program'],
      'en',
    );

    expect(result).toEqual({
      'dashboard.payment-history.heading': {
        key: 'dashboard.payment-history.heading',
        title: 'Payment history',
        body: '',
      },
      'dashboard.payment-history.table.program': {
        key: 'dashboard.payment-history.table.program',
        title: 'Program',
        body: '',
      },
    });
    const requestedUrl = fetchMock.mock.calls[0][0] as URL;
    expect(requestedUrl.searchParams.getAll('filters[key][$in]')).toEqual([
      'dashboard.payment-history.heading',
      'dashboard.payment-history.table.program',
    ]);
  });

  it('omits keys with no matching entry from a batch fetch', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ id: 1, key: 'known.key', title: 'Known', body: '' }],
      }),
    }) as unknown as typeof fetch;

    const client = new StrapiContentClient('http://localhost:1337');
    const result = await client.getPageContents(['known.key', 'missing.key'], 'en');

    expect(result).toEqual({
      'known.key': { key: 'known.key', title: 'Known', body: '' },
    });
    expect(result['missing.key']).toBeUndefined();
  });
});
