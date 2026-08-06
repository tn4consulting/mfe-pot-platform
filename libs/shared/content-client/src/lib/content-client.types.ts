export interface PageContent {
  key: string;
  title: string;
  body: string;
}

export interface ContentClient {
  getPageContent(key: string, locale: 'en' | 'fr'): Promise<PageContent | null>;
  getPageContents(keys: string[], locale: 'en' | 'fr'): Promise<Record<string, PageContent>>;
}
