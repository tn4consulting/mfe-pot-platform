export declare const SUPPORTED_LOCALES: readonly ["en", "fr"];
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export declare const DEFAULT_LOCALE: Locale;
/**
 * Cross-remote locale sync, deliberately NOT a shared federation singleton
 * (see CLAUDE.md's federation-sharing policy) -- active locale crosses
 * remote boundaries as data (localStorage) plus a lightweight broadcast
 * event, exactly like the mock auth session. Every app bundles its own copy
 * of Transloco and this helper; they all agree on the current locale
 * because they all read/write the same storage key and listen for the same
 * event, not because they share one running instance of anything.
 */
export declare function getStoredLocale(): Locale;
export declare function broadcastLocaleChange(locale: Locale): void;
export declare function onLocaleChange(callback: (locale: Locale) => void): () => void;
//# sourceMappingURL=locale-sync.d.ts.map