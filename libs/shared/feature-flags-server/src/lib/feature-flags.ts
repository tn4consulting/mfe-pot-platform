export interface FlagContext {
  /** The signed-in citizen's sub claim, for a userId-targeted percentage rollout. */
  userId?: string;
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
}
