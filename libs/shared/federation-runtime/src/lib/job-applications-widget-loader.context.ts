import { createContext, useContext } from 'react';
import { WidgetLoader } from './widget-loader.types';

/**
 * Loads job-bank's job-applications widget. Same host-mediated pattern as
 * `PaymentHistoryWidgetLoaderContext`: the shell loads job-bank's
 * `./JobApplicationsWidget` and hands the resolved component down to
 * dashboard via this Context, rather than dashboard calling
 * `loadRemoteModule` on another remote directly (see CLAUDE.md's
 * federation-sharing policy for why that doesn't work).
 */
export const JobApplicationsWidgetLoaderContext = createContext<WidgetLoader | undefined>(undefined);

export function useJobApplicationsWidgetLoader(): WidgetLoader | undefined {
  return useContext(JobApplicationsWidgetLoaderContext);
}
