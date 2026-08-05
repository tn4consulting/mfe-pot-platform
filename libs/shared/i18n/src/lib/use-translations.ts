import { useCallback, useEffect, useState } from 'react';
import { Locale } from '@tn4consulting/shared-locale-sync';
import { interpolate } from './interpolate';

type Translations = Record<string, string>;

function flatten(obj: Record<string, unknown>, prefix = ''): Translations {
  const result: Translations = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      result[fullKey] = value;
    } else if (value && typeof value === 'object') {
      Object.assign(result, flatten(value as Record<string, unknown>, fullKey));
    }
  }
  return result;
}

/**
 * Fetches this app's own `assets/i18n/<locale>.json` relative to
 * `assetBaseUrl` (its own origin, not the shell's) -- the same URL shape
 * and JSON file Transloco's own loader used, so no translation file needs
 * to change to move off Transloco. `t`'s optional `params` supports the
 * same `{{key}}` interpolation Transloco's pipe did (see `interpolate.ts`)
 * -- real usage this needs to keep working: employment-insurance's
 * `reportingStatus.nextReportDue` (`{date, days}`) and the shell's
 * `accountMenu.signOut` (`{name}`).
 */
export function useTranslations(assetBaseUrl: string, locale: Locale) {
  const [translations, setTranslations] = useState<Translations>({});

  useEffect(() => {
    let cancelled = false;
    fetch(new URL(`assets/i18n/${locale}.json`, assetBaseUrl).href)
      .then((res) => res.json())
      .then((json: Record<string, unknown>) => {
        if (!cancelled) {
          setTranslations(flatten(json));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTranslations({});
        }
      });
    return () => {
      cancelled = true;
    };
  }, [assetBaseUrl, locale]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const template = translations[key] ?? key;
      return interpolate(template, params);
    },
    [translations],
  );

  return { t };
}
