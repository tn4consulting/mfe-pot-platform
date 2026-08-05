import { createContext, useContext } from 'react';
import { WidgetLoader } from './widget-loader.types';

/**
 * Loads the payment-history widget component that dashboard (a separately
 * deployed remote, in its own repo) exposes. Lives here (a shared package
 * both the shell repo and the employment-life-events repo depend on)
 * rather than in employment-life-events' own feature code, so shell's repo
 * isn't compile-time dependent on employment-life-events' repo.
 *
 * No providers travel with it -- dashboard's widget is fully
 * self-configuring (fetches its own runtime config, builds its own API
 * client internally), same as every other remote in this family. Contrast
 * with the Angular-DI version this replaces, which paired the component
 * with an explicit `providers` array the consumer had to apply via a child
 * `EnvironmentInjector` before mounting.
 */
export const PaymentHistoryWidgetLoaderContext = createContext<WidgetLoader | undefined>(undefined);

/**
 * Returns `undefined` if the host hasn't provided a value -- mirrors the
 * old `inject(PAYMENT_HISTORY_WIDGET_LOADER, { optional: true })` call,
 * since not every host that renders employment-life-events' guided-journey
 * component necessarily wants to embed the payment-history widget.
 */
export function usePaymentHistoryWidgetLoader(): WidgetLoader | undefined {
  return useContext(PaymentHistoryWidgetLoaderContext);
}
