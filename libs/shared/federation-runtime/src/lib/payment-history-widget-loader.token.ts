import { EnvironmentProviders, InjectionToken, Provider, Type } from '@angular/core';

export interface LoadedPaymentHistoryWidget {
  component: Type<unknown>;
  providers: (Provider | EnvironmentProviders)[];
}

/**
 * Loads the payment-history widget component that dashboard (a separately
 * deployed remote, in its own repo) exposes, along with dashboard's own
 * providers for it (e.g. the API client it needs to fetch payment data) --
 * see CLAUDE.md's federation-sharing policy for why this remote doesn't
 * call `loadRemoteModule` on another remote directly, and `RemoteRouteHost`
 * for the identical component+providers pairing this mirrors. Without its
 * own providers, the widget would inject nothing (or, worse, silently
 * resolve to whichever host happens to provide the same token) once
 * mounted under a host's own environment injector.
 *
 * Lives here (a shared package both the shell repo and the
 * employment-life-events repo depend on) rather than in
 * employment-life-events' own feature library, where it used to live --
 * that made shell's repo compile-time dependent on employment-life-events'
 * repo, which doesn't work once they're separate repos.
 */
export type PaymentHistoryWidgetLoader = () => Promise<LoadedPaymentHistoryWidget>;

export const PAYMENT_HISTORY_WIDGET_LOADER =
  new InjectionToken<PaymentHistoryWidgetLoader>(
    'PAYMENT_HISTORY_WIDGET_LOADER',
  );
