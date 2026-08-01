/**
 * The shell's stubbed Sign-In-Canada-style mock login issues this. Crosses
 * remote boundaries as a small versioned DTO (via sessionStorage + a
 * broadcast event -- see session-sync.ts), not a shared federation
 * singleton, per CLAUDE.md's minimize-cross-MFE-state policy. There is no
 * real IdP and no real signing here -- this is a proof-of-technology, not a
 * production auth system.
 */
export interface AuthSession {
  sub: string;
  name: string;
  claims: string[];
  issuedAt: number;
  expiresAt: number;
}
