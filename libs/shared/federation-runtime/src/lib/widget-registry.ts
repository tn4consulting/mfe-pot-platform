import { createContext, useContext, ComponentType } from 'react';
import { WidgetLoader } from './widget-loader.types';
import { RemoteModuleLoaderContext } from './remote-module-loader.context';

/**
 * Replaces the old one-Context-per-widget-type pattern (payment-history,
 * job-applications, ei-reporting-status each had their own hand-written
 * Context+hook pair). Adding a widget for a new life event used to mean
 * adding a new named export here, a new Provider in the shell's route, and
 * a bespoke consumer hook -- with N life events x M widget types that
 * doesn't scale. A widget id is just a key into this registry; the
 * `RemoteModuleLoaderContext` underneath was already fully generic.
 */
export interface WidgetDescriptor {
  remoteName: string;
  exposedModule: string;
  exportName: string;
}

export type WidgetRegistry = Record<string, WidgetDescriptor>;

export const WidgetRegistryContext = createContext<WidgetRegistry | undefined>(undefined);

/**
 * Returns `undefined` if there's no host to resolve this widget from --
 * either no `RemoteModuleLoaderContext` at all (e.g. this remote is
 * running standalone, `nx serve`/tests, with no shell above it) or a host
 * is present but hasn't registered this widget id. Reads
 * `RemoteModuleLoaderContext` directly (not the throwing
 * `useRemoteModuleLoader()` hook) specifically so the no-host case
 * degrades gracefully instead of throwing -- mirrors the old per-widget
 * hooks' "no host has provided a value" case, which every app repo's own
 * standalone-testability requirement (see mfe-pot-platform's CLAUDE.md,
 * "Independent testability") depends on.
 */
export function useWidgetLoader(widgetId: string): WidgetLoader | undefined {
  const loadRemoteModule = useContext(RemoteModuleLoaderContext);
  const registry = useContext(WidgetRegistryContext);
  const descriptor = registry?.[widgetId];
  if (!loadRemoteModule || !descriptor) {
    return undefined;
  }
  return async () => {
    const widgetModule = await loadRemoteModule(descriptor.remoteName, descriptor.exposedModule);
    return { component: widgetModule[descriptor.exportName] as ComponentType<Record<string, unknown>> };
  };
}
