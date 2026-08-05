/**
 * Replaces `{{key}}` placeholders -- the same syntax Transloco used, kept
 * on purpose so existing `assets/i18n/<locale>.json` translation files
 * need zero changes to convert. An unmatched placeholder is left as-is
 * rather than blanked, so a missing param shows up as a visible bug
 * (`{{date}}` in the rendered text) instead of silently vanishing.
 */
export function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
}
