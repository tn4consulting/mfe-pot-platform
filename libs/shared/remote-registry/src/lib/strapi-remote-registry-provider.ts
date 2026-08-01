import type { RemoteRegistryEntry, RemoteRegistryProvider } from './remote-registry.types';

interface StrapiRemoteAttributes {
  name: string;
  url: string;
  routePrefix: string;
  version: string;
}

interface StrapiListResponse<T> {
  data: (T & { id: number })[];
}

/**
 * Local-dev directory server: reads the federation manifest from Strapi's
 * "Remote" content type. Editing an entry in Strapi and reloading the shell
 * picks up the change with no rebuild/restart -- this is the actual
 * "portable directory server" capability, not just config-file editing.
 */
export class StrapiRemoteRegistryProvider implements RemoteRegistryProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs = 3000,
  ) {}

  async getRemotes(): Promise<RemoteRegistryEntry[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/remotes`, {
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Strapi returned ${response.status} for /api/remotes`);
      }
      const body = (await response.json()) as StrapiListResponse<StrapiRemoteAttributes>;
      return body.data.map((entry) => ({
        name: entry.name,
        url: entry.url,
        routePrefix: entry.routePrefix,
        version: entry.version,
      }));
    } finally {
      clearTimeout(timeout);
    }
  }
}
