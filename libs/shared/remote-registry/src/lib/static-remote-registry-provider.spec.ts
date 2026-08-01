import { StaticRemoteRegistryProvider } from './static-remote-registry-provider';

describe('StaticRemoteRegistryProvider', () => {
  it('returns the fixed entries it was constructed with', async () => {
    const entries = [
      { name: 'dashboard', url: 'https://mfe-pot-dashboard.web.app/remoteEntry.json', routePrefix: '/dashboard', version: '0.0.1' },
    ];
    const provider = new StaticRemoteRegistryProvider(entries);

    await expect(provider.getRemotes()).resolves.toEqual(entries);
  });
});
