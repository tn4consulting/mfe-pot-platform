declare global {
  interface Window {
    /**
     * Populated by each container's entrypoint script from env vars
     * injected via its Helm chart's ConfigMap (see CLAUDE.md's Hosting
     * section) -- absent under plain `nx serve`, where dev defaults apply
     * instead.
     */
    __mfePotEnv?: Record<string, unknown>;
  }
}

/**
 * Reads runtime configuration, falling back to dev-time defaults when
 * nothing has been injected. Replaces the old build-time
 * `environment.ts`/`environment.prod.ts` + `fileReplacements` pair: one
 * container image gets built once and promoted across environments
 * unchanged, with environment-specific values supplied at pod startup
 * instead of baked in at build time. Each app defines its own config shape
 * (the fields it actually needs) and passes its dev defaults here --
 * deliberately generic rather than this package knowing every app's shape.
 *
 * **Only correct for an app loaded as the top-level page.** `window.__mfePotEnv`
 * is populated by a blocking `<script src="env.js">` in *that app's own*
 * `index.html` -- which never runs for an app loaded as a federated
 * remote (Native Federation imports the remote's JS module directly into
 * the host's already-running page; the remote's own `index.html` is never
 * navigated to, so its `env.js` script tag never executes). A remote read
 * `window.__mfePotEnv` here anyway, silently got the *host's* config
 * (missing all of the remote's own keys), and fell back to its dev
 * defaults in every real deployment -- confirmed the hard way via an
 * actual browser (Playwright), not curl, against every extracted app
 * (`msca-shell.mfe-pot.local` proxying job-bank/employment-insurance/dashboard
 * all failed to reach their own BFFs). Use `fetchRuntimeConfig` instead
 * for anything that might run as a federated remote, which is every app
 * except the actual host apps (`msca-shell`, `job-bank-shell`).
 */
export function getRuntimeConfig<T extends object>(devDefaults: T): T {
  const injected = typeof window !== 'undefined' ? window.__mfePotEnv : undefined;
  if (!injected) {
    return devDefaults;
  }
  return { ...devDefaults, ...(injected as Partial<T>) };
}

/**
 * A Helm chart's `values.yaml` sets e.g. `jobBankBffBaseUrl: ""` (empty --
 * "this app's own origin, no path prefix"; every `<Domain>ApiClient`
 * appends its own `/api/...` suffix, so the base URL itself is always
 * just an origin, dev default or chart value alike) or, in principle, a
 * root-relative path -- either way meaning "this app's own Ingress path
 * rule". Correct when this app is the top-level navigated page, since a
 * relative `fetch('/api/...')` resolves against the current page's
 * origin, which is the same thing in that case. Not correct for a
 * federated remote: that fetch call actually runs on the host page (e.g.
 * the shell), so a relative/empty value silently resolved against the
 * *host's* origin instead -- confirmed the hard way via Playwright
 * (job-bank's own BFF call returned the shell's `index.html`, a
 * JSON-parse error, not a network error, since the shell's nginx happily
 * served *something* at that path). Resolving every string value against
 * `ownOriginUrl` here fixes both cases uniformly: a same-origin
 * top-level page gets the identical URL either way, and a federated
 * remote gets an absolute URL pointing at its own origin instead of the
 * host's.
 */
function resolveRelativeUrls<T extends object>(config: T, ownOriginUrl: string): T {
  const resolved = { ...config } as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(resolved)) {
    if (typeof value === 'string' && (value === '' || value.startsWith('/'))) {
      resolved[key] = new URL(value, ownOriginUrl).href.replace(/\/$/, '');
    }
  }
  return resolved as unknown as T;
}

/**
 * The federation-safe replacement for `getRuntimeConfig`: fetches this
 * app's own `env.js` directly from `ownOriginUrl` (pass the same
 * `assetBaseUrl` every app already computes for its own i18n assets --
 * see `remote-providers.ts` in any extracted app for the two-statement
 * `import.meta.url` pattern; keep it in the *app*, not this shared lib,
 * since that computation is itself sensitive to which bundle it runs in)
 * rather than trusting `window.__mfePotEnv` to already carry this app's
 * values. Works correctly whether this app is the top-level page (an
 * extra, harmless network round-trip re-fetching what its own `env.js`
 * script tag already set) or a federated remote (the only way to
 * actually reach its own values in that case). `env.js`'s content is
 * always the literal `window.__mfePotEnv = {...};` the entrypoint script
 * writes -- see `tools/docker/frontend-entrypoint.sh`.
 */
export async function fetchRuntimeConfig<T extends object>(
  ownOriginUrl: string,
  devDefaults: T,
): Promise<T> {
  try {
    const res = await fetch(new URL('env.js', ownOriginUrl).href);
    const text = await res.text();
    const match = text.match(/window\.__mfePotEnv\s*=\s*(\{[\s\S]*?\});?\s*$/);
    if (!match) {
      return devDefaults;
    }
    const injected = JSON.parse(match[1]) as Partial<T>;
    return resolveRelativeUrls({ ...devDefaults, ...injected }, ownOriginUrl);
  } catch {
    return devDefaults;
  }
}
