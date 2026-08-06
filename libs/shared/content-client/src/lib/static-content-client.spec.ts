import { StaticContentClient } from './static-content-client';

describe('StaticContentClient', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('fetches this app\'s own assets/content-fallback/<locale>.json', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({
          'dashboard.overview.intro': { title: 'Welcome to your account', body: 'Overview...' },
        }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const client = new StaticContentClient('http://localhost:4201/');
    const result = await client.getPageContent('dashboard.overview.intro', 'en');

    expect(result).toEqual({
      key: 'dashboard.overview.intro',
      title: 'Welcome to your account',
      body: 'Overview...',
    });
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:4201/assets/content-fallback/en.json');
  });

  it('returns null for an unknown key', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({}),
    }) as unknown as typeof fetch;

    const client = new StaticContentClient('http://localhost:4201/');
    await expect(client.getPageContent('unknown.key', 'en')).resolves.toBeNull();
  });

  it('fetches multiple keys in one call, omitting unknown ones', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({
          'a.key': { title: 'A', body: '' },
          'b.key': { title: 'B', body: '' },
        }),
    }) as unknown as typeof fetch;

    const client = new StaticContentClient('http://localhost:4201/');
    await expect(client.getPageContents(['a.key', 'b.key', 'missing.key'], 'en')).resolves.toEqual({
      'a.key': { key: 'a.key', title: 'A', body: '' },
      'b.key': { key: 'b.key', title: 'B', body: '' },
    });
  });

  it('only fetches each locale once, caching the result across calls', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ 'a.key': { title: 'A', body: '' } }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const client = new StaticContentClient('http://localhost:4201/');
    await client.getPageContent('a.key', 'en');
    await client.getPageContent('a.key', 'en');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns empty results (not a rejection) when the fallback file itself fails to load', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down')) as unknown as typeof fetch;
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const client = new StaticContentClient('http://localhost:4201/');
    await expect(client.getPageContents(['a.key'], 'en')).resolves.toEqual({});
  });
});
