import { InjectionToken } from '@angular/core';

/**
 * Same reasoning as `REMOTE_MODULE_LOADER`: this library must never import
 * `react`/`react-dom` directly. Native Federation's builder only keeps a
 * package external for the entry points/exposes it manages itself -- a
 * plain Nx library that imports `react-dom/client` risks bundling its own
 * disconnected copy of React, separate from the one the mounted remote's
 * own bundle uses. Two React copies rendering into the same page throws
 * "invalid hook call" the moment the remote's component calls a hook,
 * since its hooks are bound to ITS copy of React while this library would
 * be calling `createElement`/`createRoot` from a different one.
 *
 * `RemoteRouteHost` takes a mount function via this token instead, so the
 * only direct import of `react`/`react-dom` lives in `apps/shell`'s own
 * code, where it reliably dedupes with whatever the federated React
 * remote's bundle resolves to (both sides sharing the same singleton via
 * `sharedReactFederationDependencies` -- see
 * `@tn4consulting/shared-federation-config/react`).
 *
 * `Component` is typed `unknown` here rather than `React.ComponentType`
 * on purpose -- this library has no dependency on `react` at all, not even
 * `@types/react`. The shell's own `REACT_MOUNTER` implementation is where
 * the real React typing lives.
 */
export interface ReactMount {
  unmount(): void;
}

export type ReactMounter = (element: HTMLElement, Component: unknown) => ReactMount;

export const REACT_MOUNTER = new InjectionToken<ReactMounter>('REACT_MOUNTER');
