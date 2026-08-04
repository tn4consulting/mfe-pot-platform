import RedisMock from 'ioredis-mock';
import { RedisSessionCache } from './redis-session-cache';

jest.mock('ioredis', () => require('ioredis-mock'));

describe('RedisSessionCache', () => {
  afterEach(() => {
    // ioredis-mock keeps a shared in-process dataset per connection string --
    // start each test from a clean slate.
    return new RedisMock().flushall();
  });

  it('builds namespaced keys from its own prefix', () => {
    const cache = new RedisSessionCache({ url: 'redis://localhost:6379', keyPrefix: 'job-bank' });
    expect(cache.buildKey('applications', 'sub-1')).toBe('job-bank:applications:sub-1');
  });

  it('returns undefined for a key that was never set', async () => {
    const cache = new RedisSessionCache({ url: 'redis://localhost:6379', keyPrefix: 'job-bank' });
    await expect(cache.getJson(cache.buildKey('applications', 'sub-1'))).resolves.toBeUndefined();
  });

  it('round-trips a JSON value through set/get', async () => {
    const cache = new RedisSessionCache({ url: 'redis://localhost:6379', keyPrefix: 'job-bank' });
    const key = cache.buildKey('applications', 'sub-1');
    await cache.setJson(key, [{ id: 'app-1' }]);
    await expect(cache.getJson(key)).resolves.toEqual([{ id: 'app-1' }]);
  });

  it('reset() clears every key under its own prefix, leaving other prefixes intact', async () => {
    const jobBank = new RedisSessionCache({ url: 'redis://localhost:6379', keyPrefix: 'job-bank' });
    const ei = new RedisSessionCache({ url: 'redis://localhost:6379', keyPrefix: 'employment-insurance' });
    await jobBank.setJson(jobBank.buildKey('applications', 'sub-1'), ['job-data']);
    await ei.setJson(ei.buildKey('claims', 'sub-1'), ['ei-data']);

    await jobBank.reset();

    await expect(jobBank.getJson(jobBank.buildKey('applications', 'sub-1'))).resolves.toBeUndefined();
    await expect(ei.getJson(ei.buildKey('claims', 'sub-1'))).resolves.toEqual(['ei-data']);
  });
});
