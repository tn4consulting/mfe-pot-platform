export const SUPPORTED_LOCALES = ['en', 'fr'];
export const DEFAULT_LOCALE = 'en';
const STORAGE_KEY = 'mfe-pot-locale';
const CHANGE_EVENT = 'mfe-pot-locale-change';
/**
 * Cross-remote locale sync, deliberately NOT a shared federation singleton
 * (see CLAUDE.md's federation-sharing policy) -- active locale crosses
 * remote boundaries as data (localStorage) plus a lightweight broadcast
 * event, exactly like the mock auth session. Every app bundles its own copy
 * of Transloco and this helper; they all agree on the current locale
 * because they all read/write the same storage key and listen for the same
 * event, not because they share one running instance of anything.
 */
export function getStoredLocale() {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    return isLocale(stored) ? stored : DEFAULT_LOCALE;
}
export function broadcastLocaleChange(locale) {
    localStorage.setItem(STORAGE_KEY, locale);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: locale }));
}
export function onLocaleChange(callback) {
    const listener = (event) => {
        const locale = event.detail;
        if (isLocale(locale)) {
            callback(locale);
        }
    };
    window.addEventListener(CHANGE_EVENT, listener);
    return () => window.removeEventListener(CHANGE_EVENT, listener);
}
function isLocale(value) {
    return typeof value === 'string' && SUPPORTED_LOCALES.includes(value);
}
//# sourceMappingURL=locale-sync.js.map