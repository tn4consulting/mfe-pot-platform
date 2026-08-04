/**
 * The shell's mock-idp login flow issues this. Crosses remote boundaries as
 * a small versioned DTO (via sessionStorage + a broadcast event -- see
 * session-sync.ts), not a shared federation singleton, per CLAUDE.md's
 * minimize-cross-MFE-state policy.
 */
export interface AuthSession {
  sub: string;
  name: string;
  claims: string[];
  issuedAt: number;
  expiresAt: number;
  /**
   * Opaque bearer credential issued by mock-idp (a real, signed JWT --
   * carries a `sin` custom claim only a verifying BFF ever decodes). Every
   * app in this family only ever forwards this as an `Authorization: Bearer`
   * header on its own BFF calls -- never decodes or acts on its contents
   * itself, per CLAUDE.md's defense-in-depth principle.
   */
  accessToken: string;
}
