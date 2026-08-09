import { initialize, type Unleash } from 'unleash-client';
import { FeatureFlags, FlagContext } from './feature-flags';

export interface UnleashFeatureFlagsOptions {
  /** Unleash's own base API URL, in-cluster Service DNS, e.g. http://unleash.default.svc.cluster.local:4242. */
  url: string;
  /** This BFF's own federation identity, e.g. "employment-insurance-bff" -- reported to Unleash as the calling app. */
  appName: string;
  clientApiToken: string;
}

/**
 * Wraps unleash-client's per-instance API (never the package's global
 * initialize()/isEnabled() free functions, which would let multiple BFFs
 * in the same process silently share one client -- not a real risk today
 * since each BFF is its own process, but keeping construction explicit and
 * instance-scoped matches SessionCache's own per-BFF-instance shape).
 */
export class UnleashFeatureFlags implements FeatureFlags {
  private readonly client: Unleash;
  private readonly ready: Promise<void>;

  constructor(options: UnleashFeatureFlagsOptions) {
    this.client = initialize({
      url: `${options.url}/api/`,
      appName: options.appName,
      customHeaders: { Authorization: options.clientApiToken },
    });
    // Bounded wait for the initial flag sync, not an unbounded one -- a
    // slow/unreachable Unleash instance must never hold up whichever BFF
    // request happens to be the first to check a flag. isEnabled() below
    // falls through to unleash-client's own safe default (false) once this
    // resolves, synced or not.
    this.ready = new Promise((resolve) => {
      this.client.once('synchronized', () => resolve());
      setTimeout(resolve, 3000);
    });
  }

  async isEnabled(flagKey: string, context?: FlagContext): Promise<boolean> {
    await this.ready;
    try {
      return this.client.isEnabled(flagKey, context?.userId ? { userId: context.userId } : undefined);
    } catch {
      return false;
    }
  }

  /** Stops the background polling connection -- call on BFF shutdown, not per-request. */
  close(): void {
    this.client.destroy();
  }
}
