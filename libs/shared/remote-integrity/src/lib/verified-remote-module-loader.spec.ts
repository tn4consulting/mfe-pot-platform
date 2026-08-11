import { sha384Base64 } from './hash-files';
import {
  createVerifiedRemoteModuleLoader,
  type RemoteModuleLoader,
  type VerifiedRemoteContext,
} from './verified-remote-module-loader';
import type { RemoteManifestClaims } from './manifest-claims.types';

describe('createVerifiedRemoteModuleLoader', () => {
  const remoteName = 'job-bank-mfe';
  const baseUrl = 'https://job-bank-mfe.example.com/';
  const componentBytes = new TextEncoder().encode('// component code');

  let expectedHash: string;
  let claims: RemoteManifestClaims;
  let context: VerifiedRemoteContext;
  let rawLoadRemoteModule: jest.MockedFunction<RemoteModuleLoader>;
  let fetchMock: jest.Mock;
  const originalFetch = globalThis.fetch;

  beforeAll(async () => {
    expectedHash = await sha384Base64(componentBytes);
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  beforeEach(() => {
    claims = {
      remoteName,
      iat: Math.floor(Date.now() / 1000),
      files: { 'remoteEntry.json': 'irrelevant-here', 'Component.js': expectedHash },
      exposesFileNames: { './Component': 'Component.js' },
    };
    context = {
      verifiedManifests: new Map([[remoteName, claims]]),
      remoteBaseUrls: new Map([[remoteName, baseUrl]]),
    };
    rawLoadRemoteModule = jest.fn().mockResolvedValue({ App: () => null });
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () =>
        componentBytes.buffer.slice(
          componentBytes.byteOffset,
          componentBytes.byteOffset + componentBytes.byteLength,
        ),
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
  });

  it('delegates to the raw loader only after a passing hash check', async () => {
    const loader = createVerifiedRemoteModuleLoader(rawLoadRemoteModule, context);
    const result = await loader(remoteName, './Component');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(rawLoadRemoteModule).toHaveBeenCalledTimes(1);
    expect(rawLoadRemoteModule).toHaveBeenCalledWith(remoteName, './Component');
    expect(result).toEqual({ App: expect.any(Function) });
  });

  it('never calls the raw loader when the fetched bytes do not match the signed hash', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new TextEncoder().encode('// tampered code').buffer,
    });
    const loader = createVerifiedRemoteModuleLoader(rawLoadRemoteModule, context);
    await expect(loader(remoteName, './Component')).rejects.toThrow(/Integrity check failed/i);
    expect(rawLoadRemoteModule).not.toHaveBeenCalled();
  });

  it('throws for a remote never admitted at Stage A', async () => {
    const emptyContext: VerifiedRemoteContext = {
      verifiedManifests: new Map(),
      remoteBaseUrls: new Map(),
    };
    const loader = createVerifiedRemoteModuleLoader(rawLoadRemoteModule, emptyContext);
    await expect(loader(remoteName, './Component')).rejects.toThrow(/not admitted/);
    expect(rawLoadRemoteModule).not.toHaveBeenCalled();
  });

  it('throws when the exposed module has no signed hash', async () => {
    const loader = createVerifiedRemoteModuleLoader(rawLoadRemoteModule, context);
    await expect(loader(remoteName, './SomeOtherWidget')).rejects.toThrow(/no signed hash/);
    expect(rawLoadRemoteModule).not.toHaveBeenCalled();
  });

  it('throws when the fetch itself fails', async () => {
    fetchMock.mockResolvedValue({ ok: false, arrayBuffer: async () => new ArrayBuffer(0) });
    const loader = createVerifiedRemoteModuleLoader(rawLoadRemoteModule, context);
    await expect(loader(remoteName, './Component')).rejects.toThrow(/fetch failed/i);
    expect(rawLoadRemoteModule).not.toHaveBeenCalled();
  });
});
