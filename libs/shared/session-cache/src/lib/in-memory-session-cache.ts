import { SessionCache } from './session-cache';

/**
 * `nx serve`'s default backing store when `REDIS_URL` isn't set -- keeps
 * local dev at zero extra setup, matching every BFF's existing
 * zero-dependency dev loop. Also what BFF unit tests inject directly
 * instead of mocking `ioredis`.
 */
export class InMemorySessionCache implements SessionCache {
  private readonly store = new Map<string, unknown>();

  constructor(private readonly keyPrefix: string) {}

  buildKey(...parts: string[]): string {
    return [this.keyPrefix, ...parts].join(':');
  }

  async getJson<T>(key: string): Promise<T | undefined> {
    return this.store.get(key) as T | undefined;
  }

  async setJson<T>(key: string, value: T): Promise<void> {
    this.store.set(key, value);
  }

  async reset(): Promise<void> {
    const ownPrefix = `${this.keyPrefix}:`;
    for (const key of this.store.keys()) {
      if (key.startsWith(ownPrefix)) {
        this.store.delete(key);
      }
    }
  }
}
