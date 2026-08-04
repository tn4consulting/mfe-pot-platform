import { createHash } from 'node:crypto';
import request from 'supertest';
import { jwtVerify, createLocalJWKSet } from 'jose';
import { createApp } from './app';
import { getJwks } from './jwks';
import { config } from './config';

const REDIRECT_URI = 'http://localhost:4200/auth/callback';
const CLIENT_ID = 'mfe-pot-shell';

function pkcePair() {
  const codeVerifier = 'a'.repeat(43);
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
}

describe('mock-idp', () => {
  const app = createApp();

  it('reports healthy', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('rejects /authorize with a disallowed redirect_uri', async () => {
    const res = await request(app).get('/authorize').query({ redirect_uri: 'http://evil.example/callback' });
    expect(res.status).toBe(400);
  });

  it('renders the sign-in page for an allowed redirect_uri', async () => {
    const { codeChallenge } = pkcePair();
    const res = await request(app).get('/authorize').query({
      redirect_uri: REDIRECT_URI,
      state: 'xyz',
      client_id: CLIENT_ID,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
    expect(res.status).toBe(200);
    expect(res.text).toContain('Social Insurance Number');
  });

  it('re-renders the sign-in page with an error for an invalid SIN', async () => {
    const { codeChallenge } = pkcePair();
    const res = await request(app).post('/authorize').type('form').send({
      redirect_uri: REDIRECT_URI,
      state: 'xyz',
      client_id: CLIENT_ID,
      code_challenge: codeChallenge,
      sin: 'not-a-sin',
    });
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/Enter a SIN/);
  });

  it('rejects a POST /authorize with a disallowed redirect_uri', async () => {
    const { codeChallenge } = pkcePair();
    const res = await request(app).post('/authorize').type('form').send({
      redirect_uri: 'http://evil.example/callback',
      state: 'xyz',
      client_id: CLIENT_ID,
      code_challenge: codeChallenge,
      sin: '123-456-789',
    });
    expect(res.status).toBe(400);
  });

  describe('the full authorization-code + PKCE exchange', () => {
    async function authorize(sin: string, name?: string) {
      const { codeVerifier, codeChallenge } = pkcePair();
      const authRes = await request(app).post('/authorize').type('form').send({
        redirect_uri: REDIRECT_URI,
        state: 'xyz',
        client_id: CLIENT_ID,
        code_challenge: codeChallenge,
        sin,
        ...(name ? { name } : {}),
      });
      expect(authRes.status).toBe(302);
      const redirectUrl = new URL(authRes.headers['location']);
      expect(redirectUrl.searchParams.get('state')).toBe('xyz');
      const code = redirectUrl.searchParams.get('code');
      expect(code).toBeTruthy();
      return { code: code as string, codeVerifier };
    }

    it('issues a verifiable access token carrying the sin custom claim', async () => {
      const { code, codeVerifier } = await authorize('987-654-321', 'Alex Chen');

      const tokenRes = await request(app).post('/token').send({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier,
      });

      expect(tokenRes.status).toBe(200);
      expect(tokenRes.body).toMatchObject({ token_type: 'Bearer', name: 'Alex Chen' });
      expect(tokenRes.body.sin).toBeUndefined();

      const jwks = await getJwks();
      const jwkSet = createLocalJWKSet(jwks as never);
      const { payload } = await jwtVerify(tokenRes.body.access_token, jwkSet, {
        issuer: config.issuer,
        audience: config.audience,
      });
      expect(payload['sin']).toBe('987-654-321');
      expect(payload['sub']).toBe(tokenRes.body.sub);
    });

    it('reproduces the existing seeded persona for the seed SIN', async () => {
      const { code, codeVerifier } = await authorize('046-454-286');
      const tokenRes = await request(app).post('/token').send({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier,
      });
      expect(tokenRes.body.sub).toBe('mock-citizen-001');
      expect(tokenRes.body.name).toBe('Jordan Tremblay');
    });

    it('rejects a code reused a second time', async () => {
      const { code, codeVerifier } = await authorize('111-222-333');
      const body = { grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI, code_verifier: codeVerifier };
      const first = await request(app).post('/token').send(body);
      expect(first.status).toBe(200);
      const second = await request(app).post('/token').send(body);
      expect(second.status).toBe(400);
    });

    it('rejects a mismatched code_verifier', async () => {
      const { code } = await authorize('444-555-666');
      const res = await request(app)
        .post('/token')
        .send({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI, code_verifier: 'wrong-verifier' });
      expect(res.status).toBe(400);
    });

    it('rejects a mismatched redirect_uri', async () => {
      const { code, codeVerifier } = await authorize('222-333-444');
      const res = await request(app).post('/token').send({
        grant_type: 'authorization_code',
        code,
        redirect_uri: 'http://localhost:4200/somewhere-else',
        code_verifier: codeVerifier,
      });
      expect(res.status).toBe(400);
    });
  });

  it('serves a JWKS document', async () => {
    const res = await request(app).get('/.well-known/jwks.json');
    expect(res.status).toBe(200);
    expect(res.body.keys).toHaveLength(1);
    expect(res.body.keys[0]).toMatchObject({ kty: 'RSA', use: 'sig', alg: 'RS256' });
  });
});
