import { AuthSession } from './auth-session.model';
/**
 * Reads the current session, treating an expired one as absent. Every app
 * bundles this logic itself (not a federation singleton, since it's
 * stateless -- see CLAUDE.md), so each remote validates independently
 * rather than trusting a value handed to it.
 */
export declare function getStoredSession(): AuthSession | null;
export declare function storeSession(session: AuthSession): void;
export declare function clearSession(): void;
/**
 * Subscribes to sign-in/sign-out, however it happens: the broadcast custom
 * event (same-document, same-tab -- how the shell notifies an already-
 * mounted remote) and the native `storage` event (cross-tab). Returns an
 * unsubscribe function.
 */
export declare function onSessionChange(callback: (session: AuthSession | null) => void): () => void;
export declare function hasClaim(session: AuthSession | null, claim: string): boolean;
//# sourceMappingURL=session-sync.d.ts.map