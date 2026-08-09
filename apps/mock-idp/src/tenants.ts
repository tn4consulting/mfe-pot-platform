import { createHash } from 'node:crypto';

// Mirror @tn4consulting/shared-auth's claims.ts literal values -- kept as a
// standalone copy here rather than a new dependency on that package, same
// "each app holds its own copy of stateless logic" convention used
// elsewhere in this family (see CLAUDE.md's "Security: defense in depth").
const CLAIM_DASHBOARD = 'dashboard:access';
const CLAIM_JOB_BANK = 'job-bank:access';
const CLAIM_EI = 'ei:access';
const CLAIM_LIFE_EVENTS = 'life-events:access';
const ALL_CLAIMS = [CLAIM_DASHBOARD, CLAIM_JOB_BANK, CLAIM_EI, CLAIM_LIFE_EVENTS];

export interface TenantRecord {
  sub: string;
  sin: string;
  name: string;
  claims: string[];
}

/**
 * Reproduces @tn4consulting/shared-auth's createMockSession() persona
 * byte-for-byte, so logging in with this exact SIN keeps every existing
 * demo/e2e path (which was built against the single hardcoded persona)
 * working unchanged after the one-click mock login is replaced by this
 * real login flow.
 */
export const SEED_SIN = '046-454-286';
const SEED_TENANT: TenantRecord = {
  sub: 'mock-citizen-001',
  sin: SEED_SIN,
  name: 'Jordan Tremblay',
  claims: ALL_CLAIMS,
};

const tenants = new Map<string, TenantRecord>([[SEED_SIN, SEED_TENANT]]);

const SIN_FORMAT = /^\d{3}-?\d{3}-?\d{3}$/;

export function isValidSinFormat(sin: string): boolean {
  return SIN_FORMAT.test(sin);
}

/**
 * Looks up the tenant for a SIN, auto-provisioning one on first use. `sub`
 * is derived deterministically from a hash of the SIN -- never the raw SIN
 * itself, keeping `sub`/`sin` distinct identifiers even in mock-idp's own
 * internal storage. Every tenant gets the same full claim grant: this PoT
 * has one claim set (see createMockSession()'s own doc comment for the
 * identical reasoning -- proving each remote's independent claim check,
 * not an access-denied demo).
 */
export function findOrCreateTenant(sin: string, name?: string): TenantRecord {
  const existing = tenants.get(sin);
  if (existing) {
    return existing;
  }

  const sub = `citizen-${createHash('sha256').update(sin).digest('hex').slice(0, 12)}`;
  const record: TenantRecord = {
    sub,
    sin,
    name: name?.trim() || 'Jordan Tremblay',
    claims: ALL_CLAIMS,
  };
  tenants.set(sin, record);
  return record;
}
