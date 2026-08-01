import { toFederationManifest } from './remote-registry.types';

describe('toFederationManifest', () => {
  it('maps entries to a name -> url record', () => {
    const result = toFederationManifest([
      { name: 'dashboard', url: 'http://localhost:4201/remoteEntry.json', routePrefix: '/dashboard', version: '0.0.1' },
      { name: 'job-bank', url: 'http://localhost:4203/remoteEntry.json', routePrefix: '/job-bank', version: '0.0.1' },
    ]);

    expect(result).toEqual({
      dashboard: 'http://localhost:4201/remoteEntry.json',
      'job-bank': 'http://localhost:4203/remoteEntry.json',
    });
  });
});
