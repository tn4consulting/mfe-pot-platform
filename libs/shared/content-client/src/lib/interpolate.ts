/** Replaces `{key}` placeholders in CMS body text with runtime values. */
export function fillTemplate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
}
