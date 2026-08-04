/**
 * A JSON-blob KV store keyed by strings the BFF builds itself, not a
 * bespoke data-modeling layer -- each BFF keeps its own business logic
 * (filtering by sub, id generation) and its own key namespace via
 * `keyPrefix`, so this stays a connection/serialization helper rather than
 * shared business state. See mfe-pot/TODO.md's "Shared BFF session cache"
 * item for why this exists.
 */
export interface SessionCache {
  getJson<T>(key: string): Promise<T | undefined>;
  setJson<T>(key: string, value: T): Promise<void>;
  /** Deletes every key under this cache instance's own keyPrefix -- powers each BFF's `/api/reset`. */
  reset(): Promise<void>;
  buildKey(...parts: string[]): string;
}
