import { InjectionToken } from '@angular/core';
import { WidgetLoader } from './widget-loader.types';

/**
 * Loads employment-insurance's EI-reporting-status widget (Angular, exposes
 * its own `./RemoteProviders` alongside `./EiReportingStatusWidget`). Same
 * host-mediated pattern as `PAYMENT_HISTORY_WIDGET_LOADER`: the shell loads
 * both and hands the resolved component + providers down to dashboard via
 * this token.
 */
export const EI_REPORTING_STATUS_WIDGET_LOADER = new InjectionToken<WidgetLoader>(
  'EI_REPORTING_STATUS_WIDGET_LOADER',
);
