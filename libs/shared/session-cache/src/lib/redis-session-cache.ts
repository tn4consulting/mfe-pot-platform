import Redis from 'ioredis';
import { SessionCache } from './session-cache';

export interface RedisSessionCacheOptions {
  url: string;
  keyPrefix: string;
}

export class RedisSessionCache implements SessionCache {
  private readonly client: Redis;
  private readonly keyPrefix: string;

  constructor(options: RedisSessionCacheOptions) {
    this.client = new Redis(options.url, { lazyConnect: true });
    this.keyPrefix = options.keyPrefix;
  }

  buildKey(...parts: string[]): string {
    return [this.keyPrefix, ...parts].join(':');
  }

  async getJson<T>(key: string): Promise<T | undefined> {
    const raw = await this.client.get(key);
    return raw === null ? undefined : (JSON.parse(raw) as T);
  }

  async setJson<T>(key: string, value: T): Promise<void> {
    await this.client.set(key, JSON.stringify(value));
  }

  /**
   * SCAN + DEL, not FLUSHDB -- this Redis instance is scoped to session-cache
   * today, but a scan-based delete stays correct even if it's ever shared
   * for anything else, since it only ever touches this cache's own prefix.
   */
  async reset(): Promise<void> {
    const ownPrefix = `${this.keyPrefix}:*`;
    let cursor = '0';
    do {
      const [nextCursor, keys] = await this.client.scan(cursor, 'MATCH', ownPrefix, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } while (cursor !== '0');
  }
}
