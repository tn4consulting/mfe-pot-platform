/**
 * Each remote checks for its OWN claim, independently -- see CLAUDE.md's
 * "Security: defense in depth" section. Never assume "the shell let me
 * navigate here, so I'm authorized."
 */
export const CLAIM_DASHBOARD = 'dashboard:access';
export const CLAIM_JOB_BANK = 'job-bank:access';
export const CLAIM_EI = 'ei:access';
export const CLAIM_EMPLOYMENT_LIFE_EVENTS = 'employment-life-events:access';
//# sourceMappingURL=claims.js.map