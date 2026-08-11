export interface RemoteTrustEntry {
  /** Must match the verified JWS's protected header `kid`. */
  kid: string;
  /** RFC 7517 public JWK, imported via jose's importJWK at verify time. */
  publicKeyJwk: Record<string, unknown>;
  alg: 'RS256';
  /**
   * Origins the remote's manifest URL may legitimately be served from.
   * A plural list, not a single origin: this family builds one image per
   * app once and promotes it unchanged across environments (CLAUDE.md's
   * "Runtime config, not build-time" section), so the exact same signed
   * `remoteEntry.json`/chunks are genuinely, legitimately served from more
   * than one origin -- e.g. kind's `http://job-bank-mfe.mfe-pot.local` and
   * EKS's `https://job-bank-mfe.aws.tn4consulting.com`. Rejects a
   * validly-signed manifest served from any origin not in this list.
   */
  allowedOrigins: string[];
  /**
   * How this entry was provisioned. Documentation only -- verification
   * logic never branches on it. Distinguishes "our own CI-signed remote"
   * from "a manually vetted external provider," per the corrected
   * single-mechanism design in the linked doc: both go through the exact
   * same runtime verification path, just different provisioning stories.
   */
  provisioning: 'first-party-ci' | 'manual-partner-onboarding';
}

export interface TrustedRemotesRegistry {
  version: 1;
  remotes: Record<string, RemoteTrustEntry>;
}
