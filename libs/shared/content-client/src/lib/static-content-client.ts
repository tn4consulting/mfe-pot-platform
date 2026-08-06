import type { ContentClient, PageContent } from './content-client.types';

type FallbackEntry = { title: string; body: string };
type FallbackFile = Record<string, FallbackEntry>;

/**
 * Baked fallback content, fetched from this app's own
 * `assets/content-fallback/<locale>.json` (same URL shape as
 * `shared-i18n`'s `useTranslations` fetching `assets/i18n/<locale>.json`)
 * -- one bilingual pair per app, generated to mirror whatever's currently
 * seeded in Strapi's `PAGE_CONTENT`. Used directly when no CMS is
 * configured at all, and as the fallback half of `FallbackContentClient`
 * when a configured CMS is unreachable at runtime.
 */
export class StaticContentClient implements ContentClient {
  private readonly cache = new Map<'en' | 'fr', Promise<FallbackFile>>();

  constructor(private readonly assetBaseUrl: string) {}

  private loadLocale(locale: 'en' | 'fr'): Promise<FallbackFile> {
    let pending = this.cache.get(locale);
    if (!pending) {
      pending = fetch(new URL(`assets/content-fallback/${locale}.json`, this.assetBaseUrl).href)
        .then((res) => res.json() as Promise<FallbackFile>)
        .catch((err) => {
          console.error(`Failed to load fallback content for locale "${locale}"`, err);
          return {};
        });
      this.cache.set(locale, pending);
    }
    return pending;
  }

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
    const entries = await this.loadLocale(locale);
    const result: Record<string, PageContent> = {};
    for (const key of keys) {
      const entry = entries[key];
      if (entry) {
        result[key] = { key, title: entry.title, body: entry.body };
      }
    }
    return result;
  }
}
