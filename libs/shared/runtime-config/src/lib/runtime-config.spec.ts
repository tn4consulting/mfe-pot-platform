import { fetchRuntimeConfig, getRuntimeConfig } from './runtime-config';

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

describe('fetchRuntimeConfig', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function mockEnvJs(body: string) {
    globalThis.fetch = jest.fn().mockResolvedValue({ text: () => Promise.resolve(body) });
  }

  it('fetches env.js from the given origin and merges over dev defaults', async () => {
    mockEnvJs('window.__mfePotEnv = {"jobBankBffBaseUrl":"https://job-bank-bff.example.com"};');
    const config = await fetchRuntimeConfig('https://job-bank.example.com/', {
      jobBankBffBaseUrl: 'http://localhost:3001',
    });
    expect(config).toEqual({ jobBankBffBaseUrl: 'https://job-bank-bff.example.com' });
    expect(globalThis.fetch).toHaveBeenCalledWith('https://job-bank.example.com/env.js');
  });

  it('resolves a root-relative injected value against this app\'s own origin, not the caller\'s', async () => {
    // The Ingress path-rule pattern ("/api" -- see CLAUDE.md's Hosting
    // section) means this remote's own origin, not whichever page's
    // fetch() call is actually resolving it -- see resolveRelativeUrls's
    // doc comment for why a plain relative value breaks under federation.
    mockEnvJs('window.__mfePotEnv = {"jobBankBffBaseUrl":"/api"};');
    const config = await fetchRuntimeConfig('https://job-bank.example.com/', {
      jobBankBffBaseUrl: 'http://localhost:3001',
    });
    expect(config).toEqual({ jobBankBffBaseUrl: 'https://job-bank.example.com/api' });
  });

  it('falls back to dev defaults for the placeholder {} env.js', async () => {
    mockEnvJs('window.__mfePotEnv = {};');
    const config = await fetchRuntimeConfig('https://job-bank.example.com/', {
      jobBankBffBaseUrl: 'http://localhost:3001',
    });
    expect(config).toEqual({ jobBankBffBaseUrl: 'http://localhost:3001' });
  });

  it('falls back to dev defaults when the fetch fails', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('network down'));
    const config = await fetchRuntimeConfig('https://job-bank.example.com/', {
      jobBankBffBaseUrl: 'http://localhost:3001',
    });
    expect(config).toEqual({ jobBankBffBaseUrl: 'http://localhost:3001' });
  });

  it('falls back to dev defaults when env.js has unexpected content', async () => {
    mockEnvJs('<!doctype html><title>404</title>');
    const config = await fetchRuntimeConfig('https://job-bank.example.com/', {
      jobBankBffBaseUrl: 'http://localhost:3001',
    });
    expect(config).toEqual({ jobBankBffBaseUrl: 'http://localhost:3001' });
  });

  it('merges rather than replaces wholesale', async () => {
    mockEnvJs('window.__mfePotEnv = {"strapiBaseUrl":"https://strapi.example.com"};');
    const config = await fetchRuntimeConfig('https://dashboard.example.com/', {
      strapiBaseUrl: 'http://localhost:1337',
      benefitAggregationBffBaseUrl: 'http://localhost:3004',
    });
    expect(config).toEqual({
      strapiBaseUrl: 'https://strapi.example.com',
      benefitAggregationBffBaseUrl: 'http://localhost:3004',
    });
  });
});
