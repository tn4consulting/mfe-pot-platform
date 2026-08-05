import { useEffect, useState } from 'react';
import { Locale, getStoredLocale, onLocaleChange } from '@tn4consulting/shared-locale-sync';

export type { Locale };
// Re-exported so a consumer only needs one import for both reading the
// active locale (useLocale, below) and changing it (e.g. a language
// toggle) -- mirrors the old Angular version's shared-i18n, which
// re-exported the same locale-sync functions for the identical reason.
export { broadcastLocaleChange } from '@tn4consulting/shared-locale-sync';

/**
 * Reacts to the shell's cross-remote locale-broadcast (localStorage +
 * CustomEvent, see `@tn4consulting/shared-locale-sync`) the same way every
 * remote in this family already does -- this is the React equivalent of
 * the old Angular version's `provideMfeTransloco()`/`TranslocoService`
 * combination re-provided per remote, just a hook instead of Angular DI.
 */
export function useLocale(): Locale {
  const [locale, setLocale] = useState<Locale>(() => getStoredLocale());
  useEffect(() => onLocaleChange(setLocale), []);
  return locale;
}
