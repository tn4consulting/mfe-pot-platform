import { AuthSession } from './auth-session.model';
import { clearSession, getStoredSession, hasClaim, onSessionChange, storeSession } from './session-sync';

function makeSession(overrides: Partial<AuthSession> = {}): AuthSession {
  const now = Date.now();
  return {
    sub: 'mock-citizen-001',
    name: 'Jordan Tremblay',
    claims: ['dashboard:access'],
    issuedAt: now,
    expiresAt: now + 60_000,
    ...overrides,
  };
}

describe('session-sync', () => {
  beforeEach(() => sessionStorage.clear());

  it('returns null when nothing is stored', () => {
    expect(getStoredSession()).toBeNull();
  });

  it('returns null for an expired session', () => {
    storeSession(makeSession({ expiresAt: Date.now() - 1000 }));
    expect(getStoredSession()).toBeNull();
  });

  it('storeSession persists the session and notifies listeners', () => {
    const received: (AuthSession | null)[] = [];
    const unsubscribe = onSessionChange((session) => received.push(session));

    const session = makeSession();
    storeSession(session);

    expect(getStoredSession()).toEqual(session);
    expect(received).toEqual([session]);

    unsubscribe();
  });

  it('clearSession removes the session and notifies listeners with null', () => {
    storeSession(makeSession());

    const received: (AuthSession | null)[] = [];
    const unsubscribe = onSessionChange((session) => received.push(session));

    clearSession();

    expect(getStoredSession()).toBeNull();
    expect(received).toEqual([null]);

    unsubscribe();
  });

  it('unsubscribe stops further notifications', () => {
    const received: (AuthSession | null)[] = [];
    const unsubscribe = onSessionChange((session) => received.push(session));

    unsubscribe();
    storeSession(makeSession());

    expect(received).toEqual([]);
  });

  describe('hasClaim', () => {
    it('is false for a null session', () => {
      expect(hasClaim(null, 'dashboard:access')).toBe(false);
    });

    it('is true when the claim is present', () => {
      expect(hasClaim(makeSession({ claims: ['job-bank:access'] }), 'job-bank:access')).toBe(true);
    });

    it('is false when the claim is absent', () => {
      expect(hasClaim(makeSession({ claims: ['job-bank:access'] }), 'ei:access')).toBe(false);
    });
  });
});
