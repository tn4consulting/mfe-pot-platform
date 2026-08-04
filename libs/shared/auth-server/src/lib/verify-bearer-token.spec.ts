import http from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import request from 'supertest';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { verifyBearerToken } from './verify-bearer-token';

const ISSUER = 'http://mock-idp.test';
const AUDIENCE = 'mfe-pot-bffs';

async function startJwksServer(jwk: Record<string, unknown>): Promise<{ url: string; close: () => Promise<void> }> {
  const server = http.createServer((_req, res) => {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ keys: [jwk] }));
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://localhost:${port}/.well-known/jwks.json`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

describe('verifyBearerToken', () => {
  let jwksServer: { url: string; close: () => Promise<void> };
  let signToken: (options?: { audience?: string }) => Promise<string>;

  beforeAll(async () => {
    const { publicKey, privateKey } = await generateKeyPair('RS256', { extractable: true });
    const jwk = await exportJWK(publicKey);
    jwk['kid'] = 'test-key';
    jwk['alg'] = 'RS256';
    jwk['use'] = 'sig';
    jwksServer = await startJwksServer(jwk);

    signToken = ({ audience = AUDIENCE } = {}) =>
      new SignJWT({
        sub: 'citizen-abc123',
        name: 'Jordan Tremblay',
        sin: '123-456-789',
        claims: ['dashboard:access'],
      })
        .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
        .setIssuer(ISSUER)
        .setAudience(audience)
        .setIssuedAt()
        .setExpirationTime('30m')
        .sign(privateKey);
  });

  afterAll(() => jwksServer.close());

  function buildApp() {
    const app = express();
    app.get(
      '/protected',
      verifyBearerToken({ jwksUrl: jwksServer.url, issuer: ISSUER, audience: AUDIENCE }),
      (req, res) => res.json(req.auth),
    );
    return app;
  }

  it('attaches the verified identity, including the sin custom claim, for a valid token', async () => {
    const token = await signToken();
    const res = await request(buildApp()).get('/protected').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      sub: 'citizen-abc123',
      name: 'Jordan Tremblay',
      sin: '123-456-789',
      claims: ['dashboard:access'],
    });
  });

  it('rejects a request with no Authorization header', async () => {
    const res = await request(buildApp()).get('/protected');
    expect(res.status).toBe(401);
  });

  it('rejects a tampered token', async () => {
    const token = await signToken();
    // Flip a character in the middle of the signature segment, not the
    // very last character -- base64url's last character can carry padding
    // bits that don't affect the underlying decoded bytes, which made this
    // test flaky (tampering the last char sometimes decoded to the exact
    // same signature bytes).
    const [header, payload, signature] = token.split('.');
    const flipIndex = Math.floor(signature.length / 2);
    const flippedChar = signature[flipIndex] === 'a' ? 'b' : 'a';
    const tamperedSignature = signature.slice(0, flipIndex) + flippedChar + signature.slice(flipIndex + 1);
    const tampered = `${header}.${payload}.${tamperedSignature}`;

    const res = await request(buildApp()).get('/protected').set('Authorization', `Bearer ${tampered}`);
    expect(res.status).toBe(401);
  });

  it('rejects a token issued for a different audience', async () => {
    const token = await signToken({ audience: 'someone-else' });
    const res = await request(buildApp()).get('/protected').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});
