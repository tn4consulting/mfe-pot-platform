// Single source of truth for each MFE's own origin, shared by federation
// -directory seeding (REMOTES in index.ts) and content-fallback seeding
// (content-seed.ts) so they can never point at two different hosts for
// the same app.
export const REMOTE_ENTRY_URLS = {
  'dashboard-mfe': process.env.REMOTE_DASHBOARD_MFE_URL ?? 'http://localhost:4201/remoteEntry.json',
  'life-events-mfe': process.env.REMOTE_LIFE_EVENTS_MFE_URL ?? 'http://localhost:4202/remoteEntry.json',
  'job-bank-mfe': process.env.REMOTE_JOB_BANK_MFE_URL ?? 'http://localhost:4203/remoteEntry.json',
  'employment-insurance-mfe':
    process.env.REMOTE_EMPLOYMENT_INSURANCE_MFE_URL ?? 'http://localhost:4204/remoteEntry.json',
} as const;
