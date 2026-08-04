import { randomUUID } from 'node:crypto';
import { config } from './config';
import type { TenantRecord } from './tenants';

export interface PendingAuthorization extends TenantRecord {
  redirectUri: string;
  codeChallenge: string;
  clientId: string;
  expiresAt: number;
}

const pendingAuthorizations = new Map<string, PendingAuthorization>();

/** One-time-use authorization code, short TTL -- standard OIDC authorization-code-flow shape. */
export function issueCode(pending: Omit<PendingAuthorization, 'expiresAt'>): string {
  const code = randomUUID();
  pendingAuthorizations.set(code, { ...pending, expiresAt: Date.now() + config.authorizationCodeTtlMs });
  return code;
}

/** Deletes on read (one-time use) and returns undefined if the code is unknown or expired. */
export function consumeCode(code: string): PendingAuthorization | undefined {
  const pending = pendingAuthorizations.get(code);
  pendingAuthorizations.delete(code);
  if (!pending || pending.expiresAt < Date.now()) {
    return undefined;
  }
  return pending;
}
