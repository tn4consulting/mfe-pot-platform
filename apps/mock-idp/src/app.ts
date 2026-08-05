import { createHash } from 'node:crypto';
import cors from 'cors';
import express, { Express } from 'express';
import { SignJWT } from 'jose';
import { config } from './config';
import { getSigningKeys } from './keys';
import { getJwks } from './jwks';
import { SEED_SIN, findOrCreateTenant, isValidSinFormat } from './tenants';
import { issueCode, consumeCode } from './codes';
import { renderAuthorizePage } from './authorize-page';

function isAllowedRedirectUri(redirectUri: string): boolean {
  try {
    const origin = new URL(redirectUri).origin;
    return config.allowedRedirectUriOrigins.includes(origin);
  } catch {
    return false;
  }
}

/**
 * Mock IdP standing in for IBM Verify SaaS: an OIDC-shaped
 * authorization-code + PKCE flow, a hosted "mock-authentication page"
 * where the demo user types a SIN, and a JWKS endpoint so BFFs can verify
 * issued tokens independently. See mfe-pot's plan doc for the full design
 * rationale (why this shape mirrors IBM Verify SaaS's real claim-mapping
 * mechanism, not just an arbitrary fake login).
 */
export function createApp(): Express {
  const app = express();
  app.use(cors());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/authorize', (req, res) => {
    const redirectUri = String(req.query['redirect_uri'] ?? '');
    if (!isAllowedRedirectUri(redirectUri)) {
      res.status(400).json({ error: 'redirect_uri is missing or not allowed' });
      return;
    }

    res.type('html').send(
      renderAuthorizePage({
        redirectUri,
        state: String(req.query['state'] ?? ''),
        clientId: String(req.query['client_id'] ?? ''),
        codeChallenge: String(req.query['code_challenge'] ?? ''),
        codeChallengeMethod: String(req.query['code_challenge_method'] ?? 'S256'),
      }),
    );
  });

  app.post('/authorize', (req, res) => {
    const {
      redirect_uri: redirectUri,
      state,
      client_id: clientId,
      code_challenge: codeChallenge,
      code_challenge_method: codeChallengeMethod,
      sin,
      name,
    } = req.body as Record<string, string>;

    if (!isAllowedRedirectUri(redirectUri)) {
      res.status(400).json({ error: 'redirect_uri is missing or not allowed' });
      return;
    }

    // An empty SIN (blank submit, e.g. a quick demo click-through) uses the
    // seeded demo persona rather than being rejected -- a *non-empty* but
    // malformed SIN is still a real validation error. Display name already
    // falls back the same way inside findOrCreateTenant.
    const effectiveSin = sin?.trim() || SEED_SIN;
    if (!isValidSinFormat(effectiveSin)) {
      res.type('html').send(
        renderAuthorizePage({
          redirectUri,
          state,
          clientId,
          codeChallenge,
          codeChallengeMethod: codeChallengeMethod || 'S256',
          error: 'Enter a SIN in the format 123-456-789 (dashes optional).',
        }),
      );
      return;
    }

    const tenant = findOrCreateTenant(effectiveSin, name);
    const code = issueCode({
      ...tenant,
      redirectUri,
      codeChallenge,
      codeChallengeMethod: codeChallengeMethod || 'S256',
      clientId,
    });

    const redirect = new URL(redirectUri);
    redirect.searchParams.set('code', code);
    redirect.searchParams.set('state', state ?? '');
    res.redirect(302, redirect.toString());
  });

  app.post('/token', async (req, res) => {
    const { code, redirect_uri: redirectUri, code_verifier: codeVerifier } = req.body as Record<string, string>;

    const pending = code ? consumeCode(code) : undefined;
    if (!pending) {
      res.status(400).json({ error: 'invalid_grant', error_description: 'Unknown, expired, or already-used code' });
      return;
    }
    if (pending.redirectUri !== redirectUri) {
      res.status(400).json({ error: 'invalid_grant', error_description: 'redirect_uri mismatch' });
      return;
    }
    // Supports both PKCE methods: 'S256' (preferred) and 'plain' (RFC 7636's
    // own documented fallback for a client that can't compute a SHA-256
    // digest -- e.g. a browser with no SubtleCrypto, which only exists in a
    // secure context (HTTPS, or the literal hostname `localhost`); a
    // plain-HTTP deployment on a hostname like shell.mfe-pot.local has none
    // at all). See the shell's auth-flight.ts for the matching client-side
    // fallback.
    const pkceValid =
      pending.codeChallengeMethod === 'plain'
        ? codeVerifier === pending.codeChallenge
        : createHash('sha256').update(codeVerifier ?? '').digest('base64url') === pending.codeChallenge;
    if (!pkceValid) {
      res.status(400).json({ error: 'invalid_grant', error_description: 'PKCE verification failed' });
      return;
    }

    const { privateKey, kid } = await getSigningKeys();
    const accessToken = await new SignJWT({
      name: pending.name,
      sin: pending.sin,
      claims: pending.claims,
    })
      .setProtectedHeader({ alg: 'RS256', kid })
      .setSubject(pending.sub)
      .setIssuer(config.issuer)
      .setAudience(config.audience)
      .setIssuedAt()
      .setExpirationTime(`${config.tokenTtlSeconds}s`)
      .sign(privateKey);

    // Deliberately excludes `sin` from this plaintext response body -- only
    // the signed JWT carries it, so only a party that verifies the token
    // (a BFF) ever sees it, even under devtools network inspection of the
    // shell's own traffic.
    res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: config.tokenTtlSeconds,
      sub: pending.sub,
      name: pending.name,
      claims: pending.claims,
    });
  });

  app.get('/.well-known/jwks.json', async (_req, res) => {
    res.json(await getJwks());
  });

  return app;
}
