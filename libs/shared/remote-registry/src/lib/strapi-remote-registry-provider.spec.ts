import { StrapiRemoteRegistryProvider } from './strapi-remote-registry-provider';

describe('StrapiRemoteRegistryProvider', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('maps the Strapi REST response into RemoteRegistryEntry[]', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            id: 1,
            name: 'dashboard',
            url: 'http://localhost:4201/remoteEntry.json',
            routePrefix: '/dashboard',
            version: '0.0.1',
          },
        ],
      }),
    }) as unknown as typeof fetch;

    const provider = new StrapiRemoteRegistryProvider('http://localhost:1337');
    const remotes = await provider.getRemotes();

    expect(remotes).toEqual([
      {
        name: 'dashboard',
        url: 'http://localhost:4201/remoteEntry.json',
        routePrefix: '/dashboard',
        version: '0.0.1',
      },
    ]);
  });

  it('throws when Strapi responds with a non-ok status', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }) as unknown as typeof fetch;

    const provider = new StrapiRemoteRegistryProvider('http://localhost:1337');
    await expect(provider.getRemotes()).rejects.toThrow('Strapi returned 500');
  });
});
