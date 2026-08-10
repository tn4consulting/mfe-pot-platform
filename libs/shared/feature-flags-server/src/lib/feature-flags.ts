export interface FlagContext {
  /** The signed-in citizen's sub claim, for a userId-targeted percentage rollout. */
  userId?: string;
  /**
   * A random per-browser-tab id (not tied to citizen identity), for a
   * rollout/variant split that still varies when every request comes from
   * this PoT's one seeded mock persona -- userId-keyed stickiness would
   * otherwise always resolve to the same variant on every demo run. See
   * dashboard-mfe's WhatsNewList.tsx for where this is generated.
   */
  sessionId?: string;
}

export interface FlagVariant {
  name: string;
  payload?: { type: string; value: string };
}

/**
 * A BFF-side flag check keyed by a flag name the caller already knows (no
 * discovery/listing API) -- the same "connection/serialization helper, not
 * shared business state" scope SessionCache keeps (see
 * @tn4consulting/shared-session-cache). Never throws: an unreachable/slow
 * flag backend degrades to whichever implementation's own safe default,
 * never a citizen-facing 500.
 */
export interface FeatureFlags {
  isEnabled(flagKey: string, context?: FlagContext): Promise<boolean>;
  /** Resolves an A/B variant assignment; null when the flag is off, unreachable, or has no variant for this context. */
  getVariant(flagKey: string, context?: FlagContext): Promise<FlagVariant | null>;
}
