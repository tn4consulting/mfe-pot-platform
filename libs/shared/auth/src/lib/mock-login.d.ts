import { AuthSession } from './auth-session.model';
/**
 * Stands in for a real Sign-In-Canada / GCKey exchange -- see CLAUDE.md's
 * "Security: defense in depth" section for why this is deliberately mocked
 * (no real IdP, no real signing). Grants every domain claim: this PoT has
 * one persona, and the point of per-remote claim checks is to prove the
 * *pattern* (each app enforces its own security independently), not to
 * demo an access-denied path.
 */
export declare function createMockSession(name?: string): AuthSession;
//# sourceMappingURL=mock-login.d.ts.map