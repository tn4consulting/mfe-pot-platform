import { FallbackContentClient } from './fallback-content-client';
import type { ContentClient, PageContent } from './content-client.types';

function makeClient(entries: Record<string, PageContent>, opts: { throws?: boolean } = {}): ContentClient {
  return {
    getPageContent: jest.fn(async (key) => entries[key] ?? null),
    getPageContents: jest.fn(async (keys: string[]) => {
      if (opts.throws) {
        throw new Error('unreachable');
      }
      const result: Record<string, PageContent> = {};
      for (const key of keys) {
        if (entries[key]) {
          result[key] = entries[key];
        }
      }
      return result;
    }),
  };
}

describe('FallbackContentClient', () => {
  it('returns primary results when the primary has every requested key', async () => {
    const primary = makeClient({ 'a.key': { key: 'a.key', title: 'Primary A', body: '' } });
    const fallback = makeClient({ 'a.key': { key: 'a.key', title: 'Fallback A', body: '' } });
    const client = new FallbackContentClient(primary, fallback);

    await expect(client.getPageContents(['a.key'], 'en')).resolves.toEqual({
      'a.key': { key: 'a.key', title: 'Primary A', body: '' },
    });
    expect(fallback.getPageContents).not.toHaveBeenCalled();
  });

  it('backfills only the keys missing from the primary, keeping primary data for the rest', async () => {
    const primary = makeClient({ 'a.key': { key: 'a.key', title: 'Primary A', body: '' } });
    const fallback = makeClient({
      'a.key': { key: 'a.key', title: 'Fallback A', body: '' },
      'b.key': { key: 'b.key', title: 'Fallback B', body: '' },
    });
    const client = new FallbackContentClient(primary, fallback);

    await expect(client.getPageContents(['a.key', 'b.key'], 'en')).resolves.toEqual({
      'a.key': { key: 'a.key', title: 'Primary A', body: '' },
      'b.key': { key: 'b.key', title: 'Fallback B', body: '' },
    });
  });

  it('falls back entirely when the primary throws', async () => {
    const primary = makeClient({}, { throws: true });
    const fallback = makeClient({ 'a.key': { key: 'a.key', title: 'Fallback A', body: '' } });
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const client = new FallbackContentClient(primary, fallback);

    await expect(client.getPageContents(['a.key'], 'en')).resolves.toEqual({
      'a.key': { key: 'a.key', title: 'Fallback A', body: '' },
    });
  });

  it('getPageContent delegates to getPageContents for a single key', async () => {
    const primary = makeClient({ 'a.key': { key: 'a.key', title: 'Primary A', body: '' } });
    const fallback = makeClient({});
    const client = new FallbackContentClient(primary, fallback);

    await expect(client.getPageContent('a.key', 'en')).resolves.toEqual({
      key: 'a.key',
      title: 'Primary A',
      body: '',
    });
  });
});
