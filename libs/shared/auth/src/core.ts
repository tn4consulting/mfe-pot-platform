// Everything from the package's main entry point except `require-session.guard`
// (Angular-Router-specific). Import via `@tn4consulting/shared-auth/core` from a
// non-Angular consumer (e.g. a React remote) to resolve zero Angular.
export * from './lib/auth-session.model';
export * from './lib/claims';
export * from './lib/session-sync';
export * from './lib/mock-login';
