import { FeatureFlags } from './feature-flags';

/**
 * The UNLEASH_URL-unset dev/test fallback -- same role
 * InMemorySessionCache plays for SessionCache. Every flag defaults to off
 * unless explicitly overridden, so local `nx serve`/tests exercise the
 * pre-rollout code path by default.
 */
export class StaticFeatureFlags implements FeatureFlags {
  constructor(private readonly overrides: Record<string, boolean> = {}) {}

  async isEnabled(flagKey: string): Promise<boolean> {
    return this.overrides[flagKey] ?? false;
  }
}
