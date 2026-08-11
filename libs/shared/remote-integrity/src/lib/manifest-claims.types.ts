/**
 * The claim set a remote's CI signs at publish time. Covers every file that
 * actually executes when the remote is loaded -- `remoteEntry.json` itself
 * plus every `exposes[].outFileName` -- not just the manifest file, since
 * `exposes` entries (unlike `shared` entries) have plain, non-content-hashed
 * filenames with nothing else tying their bytes to the manifest's own hash.
 */
export interface RemoteManifestClaims {
  remoteName: string;
  /** Unix seconds, set by the signing CLI. */
  iat: number;
  /** Keyed by outFileName ("remoteEntry.json" plus every exposes[].outFileName). Value is a base64-encoded SHA-384 digest, no algorithm prefix. */
  files: Record<string, string>;
  /** Keyed by expose key (e.g. "./Component"), value is that expose's outFileName -- lets a verified loader look up which file backs a given expose without re-fetching/re-parsing remoteEntry.json itself. */
  exposesFileNames: Record<string, string>;
}
