import { sha384Base64 } from './hash-files';

describe('sha384Base64', () => {
  it('produces the known SHA-384 digest for a fixed input', async () => {
    const bytes = new TextEncoder().encode('hello world');
    const digest = await sha384Base64(bytes);
    // openssl dgst -sha384 -binary <<< "hello world" | base64
    expect(digest).toBe('/b2OdaZ/KfcBpOBAOF4uI5hjA+oQI5IRr5B/y7g1eLPkF8txzmRu/QgZ3YwIjeG9');
  });

  it('produces a different digest for different bytes', async () => {
    const a = await sha384Base64(new TextEncoder().encode('a'));
    const b = await sha384Base64(new TextEncoder().encode('b'));
    expect(a).not.toBe(b);
  });

  it('accepts a plain ArrayBuffer as well as a Uint8Array', async () => {
    const bytes = new TextEncoder().encode('hello world');
    const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const digest = await sha384Base64(arrayBuffer);
    expect(digest).toBe('/b2OdaZ/KfcBpOBAOF4uI5hjA+oQI5IRr5B/y7g1eLPkF8txzmRu/QgZ3YwIjeG9');
  });
});
