import type { Core } from '@strapi/strapi';
import { REMOTE_ENTRY_URLS } from './remote-config';

interface ContentSource {
  name: string;
  baseUrl: string;
}

function toBaseUrl(remoteEntryUrl: string): string {
  return remoteEntryUrl.replace(/\/remoteEntry\.json$/, '');
}

// job-bank-shell and msca-shell are host apps, not federated remotes -- no
// REMOTE_*_URL entry of their own, so each gets its own dedicated env var.
// job-bank-shell's Ingress host is "job-bank", not "job-bank-shell" --
// confirmed from mfe-pot-job-bank-shell/charts/job-bank-shell/values.yaml.
// msca-shell's own content-fallback carries the life-events.*.hub-tile
// keys shown on its /life-events hub page.
const CONTENT_SOURCES: ContentSource[] = [
  { name: 'dashboard-mfe', baseUrl: toBaseUrl(REMOTE_ENTRY_URLS['dashboard-mfe']) },
  { name: 'life-events-mfe', baseUrl: toBaseUrl(REMOTE_ENTRY_URLS['life-events-mfe']) },
  { name: 'job-bank-mfe', baseUrl: toBaseUrl(REMOTE_ENTRY_URLS['job-bank-mfe']) },
  { name: 'employment-insurance-mfe', baseUrl: toBaseUrl(REMOTE_ENTRY_URLS['employment-insurance-mfe']) },
  { name: 'job-bank-shell', baseUrl: process.env.CONTENT_JOB_BANK_SHELL_URL ?? 'http://localhost:4205' },
  { name: 'msca-shell', baseUrl: process.env.CONTENT_MSCA_SHELL_URL ?? 'http://localhost:4200' },
];

type FallbackFile = Record<string, { title: string; body: string }>;
interface SourcedPage {
  key: string;
  en: { title: string; body: string };
  fr: { title: string; body: string };
}

async function fetchLocaleFile(baseUrl: string, locale: 'en' | 'fr'): Promise<FallbackFile> {
  const res = await fetch(new URL(`assets/content-fallback/${locale}.json`, `${baseUrl}/`).href);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as FallbackFile;
}

// One unreachable source must never crash the whole pass -- returns null
// (skip this source this tick) rather than throwing. Expected on a
// from-scratch deploy: Strapi comes up before any of the 6 content-owning
// apps exist -- see config/cron-tasks.ts for the self-heal path.
async function fetchContentFromSource(strapi: Core.Strapi, source: ContentSource): Promise<SourcedPage[] | null> {
  let en: FallbackFile;
  let fr: FallbackFile;
  try {
    [en, fr] = await Promise.all([fetchLocaleFile(source.baseUrl, 'en'), fetchLocaleFile(source.baseUrl, 'fr')]);
  } catch (err) {
    strapi.log.warn(`[content-seed] ${source.name} unreachable, will retry: ${(err as Error).message}`);
    return null;
  }
  const pages: SourcedPage[] = [];
  for (const key of Object.keys(en)) {
    if (!fr[key]) {
      strapi.log.warn(`[content-seed] ${source.name}: key "${key}" in en.json but missing in fr.json, skipping`);
      continue;
    }
    pages.push({ key, en: en[key], fr: fr[key] });
  }
  return pages;
}

// Identical idempotent findFirst-before-create logic the old
// seedPageContent had -- unchanged, just fed from a fetched list instead
// of a hardcoded array. Only creates missing keys; never updates an
// already-seeded key's title/body (same limitation as before).
async function seedPageContentEntries(strapi: Core.Strapi, pages: SourcedPage[]) {
  for (const page of pages) {
    const existingEn = await strapi.documents('api::page-content.page-content').findFirst({
      filters: { key: page.key },
      locale: 'en',
    });
    if (!existingEn) {
      const created = await strapi.documents('api::page-content.page-content').create({
        data: { key: page.key, title: page.en.title, body: page.en.body },
        locale: 'en',
      });
      await strapi.documents('api::page-content.page-content').update({
        documentId: created.documentId,
        data: { title: page.fr.title, body: page.fr.body },
        locale: 'fr',
      });
      strapi.log.info(`[content-seed] created page-content: ${page.key} (en + fr)`);
    }
  }
}

export async function seedContentFromSources(strapi: Core.Strapi) {
  for (const source of CONTENT_SOURCES) {
    const pages = await fetchContentFromSource(strapi, source);
    if (pages) {
      await seedPageContentEntries(strapi, pages);
    }
  }
}
