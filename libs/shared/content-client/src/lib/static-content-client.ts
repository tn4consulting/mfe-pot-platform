import type { ContentClient, PageContent } from './content-client.types';

/**
 * Firebase-hosted demo (no live CMS on static hosting) and unit tests alike:
 * a fixed, pre-baked lookup of key+locale -> content. Same interface as the
 * Strapi-backed client, so consuming components don't change.
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
