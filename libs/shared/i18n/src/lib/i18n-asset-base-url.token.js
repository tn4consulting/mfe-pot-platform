import { InjectionToken } from '@angular/core';
/**
 * Each app provides its OWN absolute origin here (computed from
 * `import.meta.url` in that app's own source, not in this shared lib --
 * `import.meta.url` reflects wherever the calling module was actually
 * served from, which is only meaningful computed at the call site). Needed
 * because a federated remote's translation files must be fetched from the
 * remote's own origin, not the shell's -- a relative fetch path would
 * resolve against the host document's origin instead.
 */
export const I18N_ASSET_BASE_URL = new InjectionToken('I18N_ASSET_BASE_URL');
//# sourceMappingURL=i18n-asset-base-url.token.js.map