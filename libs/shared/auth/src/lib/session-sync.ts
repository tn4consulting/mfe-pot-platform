import { AuthSession } from './auth-session.model';

const SESSION_STORAGE_KEY = 'mfe-pot-auth-session';
const SESSION_CHANGE_EVENT = 'mfe-pot-auth-session-change';

/**
 * Reads the current session, treating an expired one as absent. Every app
 * bundles this logic itself (not a federation singleton, since it's
 * stateless -- see CLAUDE.md), so each remote validates independently
 * rather than trusting a value handed to it.
 */
export function getStoredSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const session = JSON.parse(raw) as AuthSession;
    if (session.expiresAt < Date.now()) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function storeSession(session: AuthSession): void {
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent(SESSION_CHANGE_EVENT, { detail: session }));
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(SESSION_CHANGE_EVENT, { detail: null }));
}

/**
 * Subscribes to sign-in/sign-out, however it happens: the broadcast custom
 * event (same-document, same-tab -- how the shell notifies an already-
 * mounted remote) and the native `storage` event (cross-tab). Returns an
 * unsubscribe function.
 */
export function onSessionChange(callback: (session: AuthSession | null) => void): () => void {
  const customHandler = (event: Event) => {
    callback((event as CustomEvent<AuthSession | null>).detail);
  };
  const storageHandler = (event: StorageEvent) => {
    if (event.key === SESSION_STORAGE_KEY) {
      callback(getStoredSession());
    }
  };

  window.addEventListener(SESSION_CHANGE_EVENT, customHandler);
  window.addEventListener('storage', storageHandler);

  return () => {
    window.removeEventListener(SESSION_CHANGE_EVENT, customHandler);
    window.removeEventListener('storage', storageHandler);
  };
}

export function hasClaim(session: AuthSession | null, claim: string): boolean {
  return session !== null && session.claims.includes(claim);
}
