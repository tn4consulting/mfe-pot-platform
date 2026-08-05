import { createContext, useContext } from 'react';

/**
 * A workspace library that imports `@softarc/native-federation` directly
 * risks getting its own bundled copy of the package, separate from the one
 * the host app's own entry initializes -- native federation's builder only
 * keeps the package external for the entry points/exposes it manages
 * itself, not for every chunk a plain library happens to end up in. A
 * second copy's module-scoped federation state is never resolved, so
 * `loadRemoteModule` calls made through it hang forever.
 *
 * `RemoteRouteHost` takes `loadRemoteModule` via this Context instead, so
 * the only direct import of the federation package lives in the host
 * app's own code, where it reliably dedupes with its bootstrap entry's
 * copy.
 */
export type RemoteModuleLoader = (
  remoteName: string,
  exposedModule: string,
) => Promise<Record<string, unknown>>;

export const RemoteModuleLoaderContext = createContext<RemoteModuleLoader | undefined>(undefined);

export function useRemoteModuleLoader(): RemoteModuleLoader {
  const loader = useContext(RemoteModuleLoaderContext);
  if (!loader) {
    throw new Error(
      'RemoteModuleLoaderContext has no value -- wrap the app root in ' +
        '<RemoteModuleLoaderContext.Provider value={loadRemoteModule}>.',
    );
  }
  return loader;
}
