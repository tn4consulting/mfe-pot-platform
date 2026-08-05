import { useEffect, useState } from 'react';
import { Locale, getStoredLocale, onLocaleChange } from '@tn4consulting/shared-locale-sync';

export type { Locale };

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
