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
 */
export function getRuntimeConfig<T extends object>(devDefaults: T): T {
  const injected = typeof window !== 'undefined' ? window.__mfePotEnv : undefined;
  if (!injected) {
    return devDefaults;
  }
  return { ...devDefaults, ...(injected as Partial<T>) };
}
