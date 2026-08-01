export interface RemoteRegistryEntry {
  name: string;
  url: string;
  routePrefix: string;
  version: string;
}

export interface RemoteRegistryProvider {
  getRemotes(): Promise<RemoteRegistryEntry[]>;
}

/** The shape Native Federation's `initFederation()` expects: name -> remoteEntry URL. */
export function toFederationManifest(
  entries: RemoteRegistryEntry[],
): Record<string, string> {
  return Object.fromEntries(entries.map((entry) => [entry.name, entry.url]));
}
