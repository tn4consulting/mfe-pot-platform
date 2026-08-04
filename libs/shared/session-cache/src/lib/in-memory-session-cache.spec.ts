import { InMemorySessionCache } from './in-memory-session-cache';

describe('InMemorySessionCache', () => {
  it('builds namespaced keys from its own prefix', () => {
    const cache = new InMemorySessionCache('job-bank');
    expect(cache.buildKey('applications', 'sub-1')).toBe('job-bank:applications:sub-1');
  });

  it('returns undefined for a key that was never set', async () => {
    const cache = new InMemorySessionCache('job-bank');
    await expect(cache.getJson(cache.buildKey('applications', 'sub-1'))).resolves.toBeUndefined();
  });

  it('round-trips a JSON value through set/get', async () => {
    const cache = new InMemorySessionCache('job-bank');
    const key = cache.buildKey('applications', 'sub-1');
    await cache.setJson(key, [{ id: 'app-1' }]);
    await expect(cache.getJson(key)).resolves.toEqual([{ id: 'app-1' }]);
  });

  it('reset() clears every key this instance holds', async () => {
    const cache = new InMemorySessionCache('job-bank');
    await cache.setJson(cache.buildKey('applications', 'sub-1'), ['sub-1-data']);
    await cache.setJson(cache.buildKey('applications', 'sub-2'), ['sub-2-data']);

    await cache.reset();

    await expect(cache.getJson(cache.buildKey('applications', 'sub-1'))).resolves.toBeUndefined();
    await expect(cache.getJson(cache.buildKey('applications', 'sub-2'))).resolves.toBeUndefined();
  });

  it('reset() does not affect a separate InMemorySessionCache instance', async () => {
    const jobBank = new InMemorySessionCache('job-bank');
    const ei = new InMemorySessionCache('employment-insurance');
    await jobBank.setJson(jobBank.buildKey('applications', 'sub-1'), ['job-data']);
    await ei.setJson(ei.buildKey('claims', 'sub-1'), ['ei-data']);

    await jobBank.reset();

    await expect(ei.getJson(ei.buildKey('claims', 'sub-1'))).resolves.toEqual(['ei-data']);
  });
});
