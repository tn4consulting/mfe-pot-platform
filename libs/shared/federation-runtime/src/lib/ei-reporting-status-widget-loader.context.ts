import { createContext, useContext } from 'react';
import { WidgetLoader } from './widget-loader.types';

/**
 * Loads employment-insurance's EI-reporting-status widget. Same
 * host-mediated pattern as `PaymentHistoryWidgetLoaderContext`: the shell
 * loads it and hands the resolved component down to dashboard via this
 * Context. Employment-insurance's widget no longer exposes its own
 * `./RemoteProviders` -- it's fully self-configuring, same as every other
 * remote in this family.
 */
export const EiReportingStatusWidgetLoaderContext = createContext<WidgetLoader | undefined>(undefined);

export function useEiReportingStatusWidgetLoader(): WidgetLoader | undefined {
  return useContext(EiReportingStatusWidgetLoaderContext);
}
