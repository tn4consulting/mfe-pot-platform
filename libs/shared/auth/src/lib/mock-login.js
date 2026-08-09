import { CLAIM_DASHBOARD, CLAIM_EI, CLAIM_LIFE_EVENTS, CLAIM_JOB_BANK } from './claims';
const SESSION_DURATION_MS = 30 * 60 * 1000;
/**
 * Stands in for a real Sign-In-Canada / GCKey exchange -- see CLAUDE.md's
 * "Security: defense in depth" section for why this is deliberately mocked
 * (no real IdP, no real signing). Grants every domain claim: this PoT has
 * one persona, and the point of per-remote claim checks is to prove the
 * *pattern* (each app enforces its own security independently), not to
 * demo an access-denied path.
 */
export function createMockSession(name = 'Jordan Tremblay') {
    const now = Date.now();
    return {
        sub: 'mock-citizen-001',
        name,
        claims: [CLAIM_DASHBOARD, CLAIM_JOB_BANK, CLAIM_EI, CLAIM_LIFE_EVENTS],
        issuedAt: now,
        expiresAt: now + SESSION_DURATION_MS,
    };
}
//# sourceMappingURL=mock-login.js.map