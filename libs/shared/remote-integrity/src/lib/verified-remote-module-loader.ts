import { sha384Base64 } from './hash-files';
import type { RemoteManifestClaims } from './manifest-claims.types';

/**
 * Structurally identical to `@tn4consulting/shared-federation-runtime`'s
 * `RemoteModuleLoader` type. Duplicated rather than imported so this
 * package has no dependency on that one -- TypeScript's structural typing
 * means a shell's real `loadRemoteModule` (typed against the other
 * package) is assignable here with no cast needed.
 */
export type RemoteModuleLoader = (
  remoteName: string,
  exposedModule: string,
) => Promise<Record<string, unknown>>;

export interface VerifiedRemoteContext {
  /** remoteName -> claims already verified by Stage A (main.tsx), so Stage B never re-fetches/re-verifies remoteEntry.json itself, only the one exposed chunk about to execute. */
  verifiedManifests: Map<string, RemoteManifestClaims>;
  /** remoteName -> base URL its files are served from, derived from the manifest URL Strapi supplied. */
  remoteBaseUrls: Map<string, string>;
}

/**
 * Wraps a raw `loadRemoteModule` so that, for every call, the specific
 * exposed file about to execute is fetched and hash-checked against
 * Stage A's already-verified claims *before* delegating to the real
 * loader. A remote absent from `context` (never admitted at Stage A, or a
 * remoteName the shell never verified) always throws rather than falling
 * through to the raw loader.
 *
 * Known limitation, not closed here: this double-fetches the chunk (once
 * to hash it, once inside the raw loader's own `import()`) -- a small
 * TOCTOU window between the two fetches, accepted at this project's scale.
 * See the linked design doc's "Open decisions" section.
 */
export function createVerifiedRemoteModuleLoader(
  rawLoadRemoteModule: RemoteModuleLoader,
  context: VerifiedRemoteContext,
): RemoteModuleLoader {
  return async (remoteName, exposedModule) => {
    const claims = context.verifiedManifests.get(remoteName);
    const baseUrl = context.remoteBaseUrls.get(remoteName);
    if (!claims || !baseUrl) {
      throw new Error(
        `createVerifiedRemoteModuleLoader: remote "${remoteName}" was not admitted to the federation manifest (failed Stage A verification)`,
      );
    }

    const outFileName = claims.exposesFileNames[exposedModule];
    const expectedHash = outFileName ? claims.files[outFileName] : undefined;
    if (!outFileName || !expectedHash) {
      throw new Error(
        `createVerifiedRemoteModuleLoader: remote "${remoteName}" has no signed hash for exposed module "${exposedModule}"`,
      );
    }

    const response = await fetch(new URL(outFileName, baseUrl));
    if (!response.ok) {
      throw new Error(
        `createVerifiedRemoteModuleLoader: fetch failed for "${remoteName}"'s "${exposedModule}" (${outFileName})`,
      );
    }
    const bytes = await response.arrayBuffer();
    const actualHash = await sha384Base64(bytes);
    if (actualHash !== expectedHash) {
      throw new Error(
        `createVerifiedRemoteModuleLoader: integrity check failed for "${remoteName}"'s "${exposedModule}" -- refusing to load`,
      );
    }

    return rawLoadRemoteModule(remoteName, exposedModule);
  };
}
