import { useEffect, useState } from 'react';
import { UnleashClient } from 'unleash-proxy-client';

export interface BrowserFeatureFlagsOptions {
  /** This app's own federation identity, e.g. "job-bank-mfe" or "msca-shell". */
  appName: string;
  /**
   * Unleash's built-in Frontend API base URL, browser-reachable, e.g.
   * http://unleash.mfe-pot.local/api/frontend -- undefined skips init
   * entirely (no local Unleash needed for plain `nx serve`; useFeatureFlag
   * then always returns its own `fallback` argument, same posture as
   * shared-observability's otlpEndpoint-unset no-op).
   */
  frontendApiUrl: string | undefined;
  /**
   * A FRONTEND-type Unleash token, NOT the same token type
   * @tn4consulting/shared-feature-flags-server's server SDK uses -- Unleash
   * rejects a CLIENT token against /api/frontend (and vice versa), confirmed
   * live standing this up (see charts/unleash/values.yaml's comment).
   */
  frontendApiToken: string;
}

let client: UnleashClient | undefined;
let startPromise: Promise<void> | undefined;

/**
 * Starts this app's own Unleash Frontend-API polling client. Idempotent --
 * same module-level guard shape as initBrowserObservability, since some
 * apps' one wiring point can run more than once per session (e.g.
 * dashboard-mfe, which exposes both ./Component and ./PaymentHistoryWidget).
 *
 * Never throws. An unreachable Unleash instance is a harmless, expected
 * runtime condition -- useFeatureFlag's own `fallback` argument covers it.
 */
export function initBrowserFeatureFlags(options: BrowserFeatureFlagsOptions): void {
  if (!options.frontendApiUrl || client) {
    return;
  }
  client = new UnleashClient({
    url: options.frontendApiUrl,
    // unleash-proxy-client's own constructor option is named `clientKey`
    // regardless of which Unleash token type is supplied -- it must be a
    // FRONTEND-type token here, see BrowserFeatureFlagsOptions.frontendApiToken.
    clientKey: options.frontendApiToken,
    appName: options.appName,
    refreshInterval: 15,
  });
  startPromise = client.start().catch(() => undefined);
}

/** Test-only escape hatch -- clears the module-level client so each test starts from a clean slate. */
export function __resetBrowserFeatureFlagsForTests(): void {
  client = undefined;
  startPromise = undefined;
}

/**
 * Resolves one flag's on/off state for the current session, re-rendering
 * on Unleash's own background refresh. Returns `fallback` (default false)
 * until the client is initialized and its first poll has resolved, and
 * permanently if initBrowserFeatureFlags was never called (e.g. plain
 * `nx serve` with no local Unleash) -- so gated UI degrades to "off" rather
 * than throwing or blocking render.
 */
export function useFeatureFlag(flagKey: string, fallback = false): boolean {
  const [enabled, setEnabled] = useState(fallback);

  useEffect(() => {
    if (!client) {
      setEnabled(fallback);
      return;
    }
    const activeClient = client;
    let cancelled = false;
    const applyState = () => {
      if (!cancelled) {
        setEnabled(activeClient.isEnabled(flagKey));
      }
    };
    startPromise?.then(applyState);
    activeClient.on('update', applyState);
    return () => {
      cancelled = true;
      activeClient.off('update', applyState);
    };
  }, [flagKey, fallback]);

  return enabled;
}
