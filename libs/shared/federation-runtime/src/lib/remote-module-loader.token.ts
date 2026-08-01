import { InjectionToken } from '@angular/core';

/**
 * A workspace library that imports `@angular-architects/native-federation`
 * directly risks getting its own bundled copy of the package, separate from
 * the one `main.ts` initializes -- native federation's builder only keeps
 * the package external for the entry points/exposes it manages itself, not
 * for every chunk a plain Nx library happens to end up in. A second copy's
 * module-scoped federation state is never resolved, so `loadRemoteModule`
 * calls made through it hang forever.
 *
 * `RemoteRouteHost` takes `loadRemoteModule` via this token instead, so the
 * only direct import of the package lives in `apps/shell`'s own code, where
 * it reliably dedupes with `main.ts`'s copy.
 */
export type RemoteModuleLoader = (
  remoteName: string,
  exposedModule: string,
) => Promise<Record<string, unknown>>;

export const REMOTE_MODULE_LOADER = new InjectionToken<RemoteModuleLoader>('REMOTE_MODULE_LOADER');
