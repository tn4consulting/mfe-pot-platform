import { getRuntimeConfig } from './runtime-config';

describe('getRuntimeConfig', () => {
  afterEach(() => {
    delete window.__mfePotEnv;
  });

  it('returns dev defaults when nothing has been injected', () => {
    const config = getRuntimeConfig({ apiBaseUrl: 'http://localhost:3001' });
    expect(config).toEqual({ apiBaseUrl: 'http://localhost:3001' });
  });

  it('overrides dev defaults with injected values', () => {
    window.__mfePotEnv = { apiBaseUrl: 'https://api.example.com' };
    const config = getRuntimeConfig({ apiBaseUrl: 'http://localhost:3001' });
    expect(config).toEqual({ apiBaseUrl: 'https://api.example.com' });
  });

  it('merges injected values over defaults rather than replacing wholesale', () => {
    window.__mfePotEnv = { apiBaseUrl: 'https://api.example.com' };
    const config = getRuntimeConfig({
      apiBaseUrl: 'http://localhost:3001',
      otherValue: 'unchanged',
    });
    expect(config).toEqual({ apiBaseUrl: 'https://api.example.com', otherValue: 'unchanged' });
  });

  it('handles a nested object value (e.g. a remotes map)', () => {
    window.__mfePotEnv = { remotes: { dashboard: 'https://dashboard.example.com' } };
    const config = getRuntimeConfig({
      remotes: { dashboard: 'http://localhost:4201' } as Record<string, string>,
    });
    expect(config.remotes).toEqual({ dashboard: 'https://dashboard.example.com' });
  });
});
