import type { RemoteRegistryEntry, RemoteRegistryProvider } from './remote-registry.types';

/**
 * Firebase-hosted demo: Firebase Hosting can't run Strapi, so the registry
 * is a static list baked in at deploy time instead of a live directory
 * server. Same interface as the Strapi-backed provider, so the shell's code
 * doesn't change between environments -- only which provider is wired up.
 */
export class StaticRemoteRegistryProvider implements RemoteRegistryProvider {
  constructor(private readonly entries: RemoteRegistryEntry[]) {}

  async getRemotes(): Promise<RemoteRegistryEntry[]> {
    return this.entries;
  }
}
