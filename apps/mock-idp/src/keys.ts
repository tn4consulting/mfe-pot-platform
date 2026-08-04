import { randomUUID } from 'node:crypto';
import { generateKeyPair } from 'jose';

type KeyPair = Awaited<ReturnType<typeof generateKeyPair>>;

export interface SigningKeys {
  privateKey: KeyPair['privateKey'];
  publicKey: KeyPair['publicKey'];
  kid: string;
}

let signingKeysPromise: Promise<SigningKeys> | null = null;

/**
 * Ephemeral RS256 keypair, generated once and cached for this process's
 * lifetime -- not persisted anywhere. Restarting mock-idp rotates the key
 * and invalidates every previously-issued token, which is fine for a demo
 * IdP: a real deployment would need a real KMS-backed key (and, for this
 * PoT's actual target architecture, real IBM Verify SaaS instead of this
 * emulator entirely).
 */
export function getSigningKeys(): Promise<SigningKeys> {
  if (!signingKeysPromise) {
    signingKeysPromise = generateKeyPair('RS256', { extractable: true }).then(({ publicKey, privateKey }) => ({
      publicKey,
      privateKey,
      kid: randomUUID().slice(0, 8),
    }));
  }
  return signingKeysPromise;
}
