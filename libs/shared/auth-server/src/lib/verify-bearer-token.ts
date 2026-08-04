import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { RequestHandler } from 'express';

/**
 * The identity mock-idp attaches to every access token it issues -- `sin`
 * is the custom claim, mirroring IBM Verify SaaS's own OIDC claims-mapping
 * feature (see mfe-pot's plan doc for the mock-idp design). Only a party
 * that verifies the token (i.e. a BFF, via `verifyBearerToken` below) ever
 * sees `sin` -- the shell only ever forwards the opaque token itself.
 */
export interface VerifiedIdentity {
  sub: string;
  name: string;
  sin: string;
  claims: string[];
}

export interface VerifyBearerTokenOptions {
  jwksUrl: string;
  issuer: string;
  audience: string;
}

// Declared directly in this module (not a separate ambient .d.ts) so it
// travels naturally with this file's own compiled output: a hand-written
// declaration-only file has no corresponding .js, so a side-effect
// `import`/`require` of it 404s at runtime once built (tsc doesn't "emit" a
// .d.ts input the way it emits one compiled from a .ts source) -- confirmed
// the hard way against a real published-shape build, not just in-workspace.
declare global {
  namespace Express {
    interface Request {
      /** Set by `verifyBearerToken` once the bearer token has been verified. */
      auth?: VerifiedIdentity;
    }
  }
}

const BEARER_PREFIX = 'Bearer ';

/**
 * Express middleware verifying a mock-idp-issued bearer token against its
 * live JWKS endpoint (RS256 signature, issuer, audience, expiry) and
 * attaching the decoded identity to `req.auth`. Each BFF mounts this
 * independently against the same mock-idp JWKS URL -- per CLAUDE.md's
 * defense-in-depth principle, no BFF trusts a claim it hasn't verified
 * itself. The JWKS set is created once per middleware instance (not per
 * request); `jose` handles its own internal key-set caching/refresh.
 */
export function verifyBearerToken(options: VerifyBearerTokenOptions): RequestHandler {
  const jwks = createRemoteJWKSet(new URL(options.jwksUrl));

  return (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith(BEARER_PREFIX)) {
      res.status(401).json({ error: 'Missing bearer token' });
      return;
    }
    const token = header.slice(BEARER_PREFIX.length);

    jwtVerify(token, jwks, { issuer: options.issuer, audience: options.audience })
      .then(({ payload }) => {
        req.auth = {
          sub: payload['sub'] as string,
          name: payload['name'] as string,
          sin: payload['sin'] as string,
          claims: (payload['claims'] as string[] | undefined) ?? [],
        };
        next();
      })
      .catch(() => {
        res.status(401).json({ error: 'Invalid or expired token' });
      });
  };
}
