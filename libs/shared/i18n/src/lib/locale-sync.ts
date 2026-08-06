export const SUPPORTED_LOCALES = ['en', 'fr'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

const STORAGE_KEY = 'mfe-pot-locale';
const CHANGE_EVENT = 'mfe-pot-locale-change';

/**
 * Cross-remote locale sync, deliberately NOT a shared federation singleton
 * (see CLAUDE.md's federation-sharing policy) -- active locale crosses
 * remote boundaries as data (localStorage) plus a lightweight broadcast
 * event, exactly like the mock auth session. Every app bundles its own copy
 * of this helper; they all agree on the current locale because they all
 * read/write the same storage key and listen for the same event, not
 * because they share one running instance of anything.
 *
 * Framework-agnostic on purpose -- used to be its own published package
 * (`shared-locale-sync`), split out specifically so a non-Angular remote
 * could use it without pulling in Angular/Transloco through shared-i18n's
 * own barrel export. Folded back in once every app in the family converted
 * to React and that reason stopped applying (2026-08) -- job-bank, the one
 * consumer that used these primitives directly without shared-i18n's own
 * hooks, now gets both from this package instead of two separate ones.
 */
export function getStoredLocale(): Locale {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  return isLocale(stored) ? stored : DEFAULT_LOCALE;
}

export function broadcastLocaleChange(locale: Locale): void {
  localStorage.setItem(STORAGE_KEY, locale);
  window.dispatchEvent(new CustomEvent<Locale>(CHANGE_EVENT, { detail: locale }));
}

export function onLocaleChange(callback: (locale: Locale) => void): () => void {
  const listener = (event: Event) => {
    const locale = (event as CustomEvent<Locale>).detail;
    if (isLocale(locale)) {
      callback(locale);
    }
  };
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}

function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
