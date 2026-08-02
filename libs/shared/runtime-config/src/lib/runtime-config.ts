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
 * (`shell.mfe-pot.local` proxying job-bank/employment-insurance/dashboard
 * all failed to reach their own BFFs). Use `fetchRuntimeConfig` instead
 * for anything that might run as a federated remote, which is every app
 * except the actual host (`shell`).
 */
export function getRuntimeConfig<T extends object>(devDefaults: T): T {
  const injected = typeof window !== 'undefined' ? window.__mfePotEnv : undefined;
  if (!injected) {
    return devDefaults;
  }
  return { ...devDefaults, ...(injected as Partial<T>) };
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
    return { ...devDefaults, ...injected };
  } catch {
    return devDefaults;
  }
}
