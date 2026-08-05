const port = process.env['PORT'] ? Number(process.env['PORT']) : 3005;

export const config = {
  // Binding to the *string* 'localhost' lets Node pick whichever address
  // family it resolves first -- on this machine that was IPv6-only (::1),
  // leaving 127.0.0.1 (what a browser's own "localhost" resolution may
  // prefer) refusing connections entirely, confirmed the hard way
  // (curl over ::1 worked, curl over 127.0.0.1 didn't, browser sign-in
  // got ERR_CONNECTION_REFUSED). 0.0.0.0 binds every IPv4 interface,
  // including 127.0.0.1 -- matches the same fix already applied to every
  // other BFF's *container* entrypoint (HOST=0.0.0.0), just needed here
  // for local `nx serve`/`node dist/...` too since mock-idp has no
  // container/Helm chart yet to set that env var for it.
  host: process.env['HOST'] ?? '0.0.0.0',
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
