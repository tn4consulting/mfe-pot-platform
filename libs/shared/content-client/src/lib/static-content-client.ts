import type { ContentClient, PageContent } from './content-client.types';

/**
 * A fixed, pre-baked lookup of key+locale -> content, same interface as the
 * Strapi-backed client so consuming components don't change. `createContentClient`
 * in each app falls back to this whenever `strapiBaseUrl` is undefined --
 * today that's deliberately true in every app's own unit tests (so specs
 * don't need a live Strapi or a fetch mock for content), and would also
 * cover a real "no CMS configured" deploy if one ever existed.
 */
export class StaticContentClient implements ContentClient {
  constructor(
    private readonly entries: Record<string, Record<'en' | 'fr', PageContent>>,
  ) {}

  async getPageContent(
    key: string,
    locale: 'en' | 'fr',
  ): Promise<PageContent | null> {
    return this.entries[key]?.[locale] ?? null;
  }
}
