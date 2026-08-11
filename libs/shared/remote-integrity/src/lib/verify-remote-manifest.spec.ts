import { exportJWK, generateKeyPair, type KeyLike, SignJWT } from 'jose';
import { verifyRemoteManifest } from './verify-remote-manifest';
import type { RemoteManifestClaims } from './manifest-claims.types';
import type { TrustedRemotesRegistry } from './trust-registry.types';

describe('verifyRemoteManifest', () => {
  const remoteName = 'job-bank-mfe';
  const kid = 'job-bank-mfe-test';
  const allowedOrigin = 'https://job-bank-mfe.example.com';
  const manifestUrl = `${allowedOrigin}/remoteEntry.json`;

  let privateKey: KeyLike;
  let registry: TrustedRemotesRegistry;
  let claims: RemoteManifestClaims;
  let validJws: string;

  async function sign(payload: RemoteManifestClaims, protectedKid = kid): Promise<string> {
    return new SignJWT(payload as unknown as Record<string, unknown>)
      .setProtectedHeader({ alg: 'RS256', kid: protectedKid })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(privateKey);
  }

  beforeAll(async () => {
    const { privateKey: priv, publicKey } = await generateKeyPair('RS256', { extractable: true });
    privateKey = priv;
    const publicKeyJwk = await exportJWK(publicKey);

    registry = {
      version: 1,
      remotes: {
        [remoteName]: {
          kid,
          publicKeyJwk,
          alg: 'RS256',
          allowedOrigins: [allowedOrigin],
          provisioning: 'first-party-ci',
        },
      },
    };

    claims = {
      remoteName,
      iat: Math.floor(Date.now() / 1000),
      files: { 'remoteEntry.json': 'abc123' },
      exposesFileNames: { './Component': 'Component.js' },
    };

    validJws = await sign(claims);
  });

  it('verifies a validly signed manifest and returns its claims', async () => {
    const result = await verifyRemoteManifest(validJws, remoteName, manifestUrl, registry);
    expect(result.remoteName).toBe(remoteName);
    expect(result.files['remoteEntry.json']).toBe('abc123');
    expect(result.exposesFileNames['./Component']).toBe('Component.js');
  });

  it('rejects an unknown remoteName', async () => {
    await expect(verifyRemoteManifest(validJws, 'unknown-mfe', manifestUrl, registry)).rejects.toThrow(
      /no trust-registry entry/,
    );
  });

  it('rejects a manifest served from an unexpected origin', async () => {
    await expect(
      verifyRemoteManifest(validJws, remoteName, 'https://evil.example.com/remoteEntry.json', registry),
    ).rejects.toThrow(/unexpected origin/);
  });

  it('accepts a manifest served from any origin in a multi-origin allowlist (same signed content promoted across kind/EKS)', async () => {
    const multiOriginRegistry: TrustedRemotesRegistry = {
      version: 1,
      remotes: {
        [remoteName]: {
          ...registry.remotes[remoteName],
          allowedOrigins: ['http://job-bank-mfe.mfe-pot.local', allowedOrigin],
        },
      },
    };
    const result = await verifyRemoteManifest(validJws, remoteName, manifestUrl, multiOriginRegistry);
    expect(result.remoteName).toBe(remoteName);
  });

  it('rejects a tampered payload', async () => {
    const [header, payload, signature] = validJws.split('.');
    const tampered = `${header}.${payload}x.${signature}`;
    await expect(verifyRemoteManifest(tampered, remoteName, manifestUrl, registry)).rejects.toThrow();
  });

  it('rejects a signature whose kid does not match the registered kid (simulates a rotated key)', async () => {
    const rotatedRegistry: TrustedRemotesRegistry = {
      version: 1,
      remotes: {
        [remoteName]: { ...registry.remotes[remoteName], kid: 'a-newer-kid' },
      },
    };
    await expect(verifyRemoteManifest(validJws, remoteName, manifestUrl, rotatedRegistry)).rejects.toThrow(
      /kid/,
    );
  });

  it('rejects a claimed remoteName that does not match the name being verified', async () => {
    const forgedJws = await sign({ ...claims, remoteName: 'dashboard-mfe' });
    await expect(verifyRemoteManifest(forgedJws, remoteName, manifestUrl, registry)).rejects.toThrow(
      /remoteName/,
    );
  });

  it('rejects an expired signature', async () => {
    const expiredJws = await new SignJWT(claims as unknown as Record<string, unknown>)
      .setProtectedHeader({ alg: 'RS256', kid })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 40)
      // A numeric value is an absolute Unix timestamp (unlike a string like
      // '30d', which jose resolves relative to the real current time at
      // .sign(), not to the backdated iat above) -- this is what actually
      // produces an already-expired token.
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(privateKey);
    await expect(verifyRemoteManifest(expiredJws, remoteName, manifestUrl, registry)).rejects.toThrow();
  });
});
