import { exportJWK } from 'jose';
import { getSigningKeys } from './keys';

/** Exposes the current public key so BFFs can verify token signatures independently. */
export async function getJwks(): Promise<{ keys: Record<string, unknown>[] }> {
  const { publicKey, kid } = await getSigningKeys();
  const jwk = await exportJWK(publicKey);
  return { keys: [{ ...jwk, kid, alg: 'RS256', use: 'sig' }] };
}
