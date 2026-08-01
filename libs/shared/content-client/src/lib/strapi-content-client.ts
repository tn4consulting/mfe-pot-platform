import type { ContentClient, PageContent } from './content-client.types';

interface StrapiPageContentAttributes {
  key: string;
  title: string;
  body: string;
}

interface StrapiListResponse<T> {
  data: (T & { id: number })[];
}

/** Local dev / integration tests: reads bilingual page content from Strapi. */
export class StrapiContentClient implements ContentClient {
  constructor(private readonly baseUrl: string) {}

  async getPageContent(
    key: string,
    locale: 'en' | 'fr',
  ): Promise<PageContent | null> {
    const url = new URL(`${this.baseUrl}/api/page-contents`);
    url.searchParams.set('locale', locale);
    url.searchParams.set('filters[key][$eq]', key);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Strapi returned ${response.status} for /api/page-contents`);
    }
    const body = (await response.json()) as StrapiListResponse<StrapiPageContentAttributes>;
    const [entry] = body.data;
    return entry ? { key: entry.key, title: entry.title, body: entry.body } : null;
  }
}
