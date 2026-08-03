import { InjectionToken } from '@angular/core';
import { WidgetLoader } from './widget-loader.types';

/**
 * Loads job-bank's job-applications widget (a React remote -- job-bank has
 * no Angular installed at all, see its federation.config.mjs). Same
 * host-mediated pattern as `PAYMENT_HISTORY_WIDGET_LOADER`: the shell loads
 * `job-bank`'s `./JobApplicationsWidget` and hands the resolved component
 * down to dashboard via this token, rather than dashboard calling
 * `loadRemoteModule` on another remote directly (see CLAUDE.md's
 * federation-sharing policy for why that doesn't work).
 */
export const JOB_APPLICATIONS_WIDGET_LOADER = new InjectionToken<WidgetLoader>(
  'JOB_APPLICATIONS_WIDGET_LOADER',
);
