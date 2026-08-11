import { importJWK, jwtVerify } from 'jose';
import type { RemoteManifestClaims } from './manifest-claims.types';
import type { TrustedRemotesRegistry } from './trust-registry.types';

/**
 * Verifies a compact JWS against the registered public key for
 * `remoteName` -- never a key embedded in the fetched payload itself, only
 * the registry the caller supplies. Checks, in order: the remote has a
 * registry entry at all, the manifest was served from that entry's
 * `allowedOrigin`, the JWS signature verifies against the registered JWK,
 * the JWS header's `kid` matches the registry entry's `kid` (catches a
 * still-valid signature from a since-rotated key), and the claimed
 * `remoteName` inside the payload matches what was asked for.
 *
 * Does NOT hash-check any file -- that's the caller's job (this function
 * only establishes that the claims themselves are authentic, not that any
 * particular fetched bytes match them).
 */
export async function verifyRemoteManifest(
  compactJws: string,
  remoteName: string,
  manifestUrl: string,
  registry: TrustedRemotesRegistry,
): Promise<RemoteManifestClaims> {
  const entry = registry.remotes[remoteName];
  if (!entry) {
    throw new Error(`verifyRemoteManifest: no trust-registry entry for "${remoteName}"`);
  }

  if (!entry.allowedOrigins.includes(new URL(manifestUrl).origin)) {
    throw new Error(
      `verifyRemoteManifest: "${remoteName}" manifest served from unexpected origin (expected one of: ${entry.allowedOrigins.join(', ')})`,
    );
  }

  const publicKey = await importJWK(entry.publicKeyJwk, entry.alg);
  const { payload, protectedHeader } = await jwtVerify(compactJws, publicKey, {
    algorithms: [entry.alg],
  });

  if (protectedHeader.kid !== entry.kid) {
    throw new Error(
      `verifyRemoteManifest: "${remoteName}" signature kid "${protectedHeader.kid}" does not match registered kid "${entry.kid}"`,
    );
  }

  const claims = payload as unknown as RemoteManifestClaims;
  if (claims.remoteName !== remoteName) {
    throw new Error(
      `verifyRemoteManifest: signed remoteName "${claims.remoteName}" does not match requested "${remoteName}"`,
    );
  }

  return claims;
}
