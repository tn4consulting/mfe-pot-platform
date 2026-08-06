import type { ContentClient, PageContent } from './content-client.types';

/**
 * Wraps a live primary client (Strapi) with a baked fallback (`StaticContentClient`)
 * so a CMS outage degrades to bilingual fallback content instead of a
 * component's own hardcoded English text. Two distinct degrade paths:
 * the primary throwing entirely (CMS unreachable) falls back for every
 * requested key; the primary succeeding but omitting some keys (not yet
 * seeded in the CMS) backfills just those from the fallback, keeping the
 * CMS's own data authoritative for everything it did return.
 */
export class FallbackContentClient implements ContentClient {
  constructor(
    private readonly primary: ContentClient,
    private readonly fallback: ContentClient,
  ) {}

  async getPageContent(
    key: string,
    locale: 'en' | 'fr',
  ): Promise<PageContent | null> {
    const results = await this.getPageContents([key], locale);
    return results[key] ?? null;
  }

  async getPageContents(
    keys: string[],
    locale: 'en' | 'fr',
  ): Promise<Record<string, PageContent>> {
    let primaryResults: Record<string, PageContent>;
    try {
      primaryResults = await this.primary.getPageContents(keys, locale);
    } catch (err) {
      console.warn('Primary content source unavailable, using fallback content', err);
      return this.fallback.getPageContents(keys, locale);
    }

    const missingKeys = keys.filter((key) => !primaryResults[key]);
    if (missingKeys.length === 0) {
      return primaryResults;
    }
    const fallbackResults = await this.fallback.getPageContents(missingKeys, locale);
    return { ...fallbackResults, ...primaryResults };
  }
}
