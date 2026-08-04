const port = process.env['PORT'] ? Number(process.env['PORT']) : 3005;

export const config = {
  host: process.env['HOST'] ?? 'localhost',
  port,
  /** Also doubles as this token's `iss` claim -- BFFs verify against the same value. */
  issuer: process.env['MOCK_IDP_ISSUER'] ?? `http://localhost:${port}`,
  /** Single shared literal: one SPA client (the shell) calling 3 resource servers (the BFFs). */
  audience: 'mfe-pot-bffs',
  /** 30 min, matching @tn4consulting/shared-auth's mock session TTL. */
  tokenTtlSeconds: 30 * 60,
  /** One-time-use authorization codes expire fast. */
  authorizationCodeTtlMs: 60 * 1000,
  /**
   * `/authorize`'s whole job is redirecting to a caller-supplied
   * `redirect_uri` -- allowlisting the origin closes the obvious
   * open-redirect hole, even in a PoT.
   */
  allowedRedirectUriOrigins: (process.env['ALLOWED_REDIRECT_URI_ORIGINS'] ?? 'http://localhost:4200').split(','),
};
