import { useEffect, useState } from 'react';
import { Locale, getStoredLocale, onLocaleChange } from './locale-sync';

/**
 * Reacts to the shell's cross-remote locale-broadcast (localStorage +
 * CustomEvent, see `./locale-sync`) the same way every remote in this
 * family already does. `Locale`/`broadcastLocaleChange`/etc. are available
 * from this package's own root export (`./locale-sync`, folded in here
 * once it stopped needing to be its own separate package -- see that
 * file's own doc comment) rather than re-exported from this file
 * specifically.
 */
export function useLocale(): Locale {
  const [locale, setLocale] = useState<Locale>(() => getStoredLocale());
  useEffect(() => onLocaleChange(setLocale), []);
  return locale;
}
