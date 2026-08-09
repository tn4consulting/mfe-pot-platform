import { AuthSession } from './auth-session.model';
import { CLAIM_DASHBOARD, CLAIM_EI, CLAIM_LIFE_EVENTS, CLAIM_JOB_BANK } from './claims';

const SESSION_DURATION_MS = 30 * 60 * 1000;

/**
 * Test-fixture factory only -- real sign-in now goes through mock-idp's
 * OIDC-shaped redirect flow (see the shell's login-page/auth-callback-page).
 * Reproduces mock-idp's seeded persona (SIN `046-454-286`) byte-for-byte, so
 * existing tests across every sibling repo that build a session via this
 * function keep working unchanged. `accessToken` is an obviously-fake
 * literal -- not a real JWT, not verifiable by any BFF; fine for tests that
 * don't call a protected endpoint. Grants every domain claim: this PoT has
 * one persona, and the point of per-remote claim checks is to prove the
 * *pattern* (each app enforces its own security independently), not to
 * demo an access-denied path.
 */
export function createMockSession(name = 'Jordan Tremblay'): AuthSession {
  const now = Date.now();
  return {
    sub: 'mock-citizen-001',
    name,
    claims: [CLAIM_DASHBOARD, CLAIM_JOB_BANK, CLAIM_EI, CLAIM_LIFE_EVENTS],
    issuedAt: now,
    expiresAt: now + SESSION_DURATION_MS,
    accessToken: 'mock-access-token-not-a-real-jwt',
  };
}
