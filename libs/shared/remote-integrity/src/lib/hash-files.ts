/**
 * SHA-384, base64-encoded, no algorithm prefix. Uses the global WebCrypto
 * `crypto.subtle` (available natively in both Node >=19 and every browser)
 * rather than `node:crypto`'s synchronous API, so this same function runs
 * unchanged in the CI signing CLI (Node) and the shell's Stage B
 * verification (browser bundle) -- mirrors the isomorphic-hashing approach
 * `auth-flight.ts` already uses for PKCE's SHA-256 challenge.
 */
export async function sha384Base64(bytes: ArrayBuffer | Uint8Array): Promise<string> {
  const buffer = bytes instanceof Uint8Array ? uint8ArrayToArrayBuffer(bytes) : bytes;
  const digest = await crypto.subtle.digest('SHA-384', buffer);
  return arrayBufferToBase64(digest);
}

function uint8ArrayToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}
