// This package's tsconfig.json deliberately uses the classic JSX
// transform (jsxFactory: React.createElement), not the automatic one --
// confirmed the hard way against a real federated build that the
// automatic transform's synthesized `import ... from 'react/jsx-runtime'`
// fails to resolve once this package is bundled as a federation-shared
// chunk ("Unable to resolve specifier 'react/jsx-runtime'"), the same
// documented native-federation limitation shared-federation-config/react.js's
// own `includeSecondaries: false` works around for 'react' itself --
// classic transform only needs the (already-shared) 'react' package,
// sidestepping jsx-runtime entirely. `import * as React` looks unused
// under some editors' linting but is required for JSX in this file to
// compile under that transform, same as job-bank's App.tsx.
import * as React from 'react';
import { Component, ComponentType, ReactNode, Suspense, lazy, useMemo } from 'react';
import { useRemoteModuleLoader } from '../remote-module-loader.context';

export interface RemoteRouteHostProps {
  /** The federation remote's registered name (e.g. "dashboard"). */
  remoteName: string;
  /**
   * Plain props forwarded to the remote's exported `App` component -- e.g.
   * a route param the host's own router resolved (`useParams()`). A remote
   * must not read the host's route params via its own bundled router
   * hooks: `react-router-dom` isn't a federation-shared singleton, so the
   * remote's copy has a different Context identity than the host's, and
   * `useParams()` inside the remote would silently resolve to nothing (the
   * same un-shared-singleton failure mode documented for other Contexts in
   * mfe-pot-platform's CLAUDE.md). A plain prop has no such identity
   * concern.
   */
  props?: Record<string, unknown>;
}

interface RemoteErrorBoundaryProps {
  children: ReactNode;
  remoteName: string;
}

interface RemoteErrorBoundaryState {
  failed: boolean;
}

/**
 * A failed remote degrades to an inline message in its own route, not a
 * crashed shell -- required for the "stop one remote, others keep working"
 * proof to hold up. Only an error boundary (not a try/catch) can catch a
 * lazily-loaded component's load/render failure.
 */
class RemoteErrorBoundary extends Component<RemoteErrorBoundaryProps, RemoteErrorBoundaryState> {
  override state: RemoteErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): RemoteErrorBoundaryState {
    return { failed: true };
  }

  override componentDidCatch(error: unknown): void {
    console.error(`Failed to load remote "${this.props.remoteName}"`, error);
  }

  override render(): ReactNode {
    if (this.state.failed) {
      return <p role="alert">This part of the page is temporarily unavailable.</p>;
    }
    return this.props.children;
  }
}

/**
 * Mounts a routed remote's exposed `./Component`. Now that the host itself
 * is React, a routed remote's exported `App` is just another component in
 * the same tree -- no second React root, no manual mount/unmount, unlike
 * the Angular-hosted version of this component this replaces (Angular's
 * `ViewContainerRef` couldn't host a React tree, so that version needed an
 * injected mount function -- `REACT_MOUNTER` -- and a manual `unmount()`
 * on destroy; a React host has no such boundary to cross, so that whole
 * layer is gone, not ported).
 *
 * There is no `./RemoteProviders` equivalent. A remote is fully
 * self-configuring -- it fetches its own runtime config and builds its own
 * API client internally, the same way job-bank's `App.tsx` always has.
 * Where a remote genuinely needs something from its host that's identity
 * -sensitive (a cross-remote widget loader, e.g. `useWidgetLoader`), it
 * reads it via this package's own Context hooks directly: because the
 * remote mounts inside the *same* React tree as the host (not a second
 * root), and `shared-federation-runtime` is a federation-shared singleton
 * (so every app resolves the identical Context object instance), a
 * `<WidgetRegistryContext.Provider>` the host renders anywhere above this
 * component is visible to the remote's own `useContext` call once it loads
 * -- no explicit passing through `RemoteRouteHost` required.
 *
 * The optional `props` field is for the opposite case: plain, non-identity
 * host state (e.g. a route param the host's own router resolved) that the
 * remote can't safely read via its own bundled copy of a library that
 * isn't a federation-shared singleton (`react-router-dom`'s `useParams()`,
 * for instance -- see `RemoteRouteHostProps.props`'s own doc comment).
 */
export function RemoteRouteHost({ remoteName, props }: RemoteRouteHostProps) {
  const loadRemoteModule = useRemoteModuleLoader();

  const RemoteComponent = useMemo(
    () =>
      lazy(async () => {
        const componentModule = await loadRemoteModule(remoteName, './Component');
        return { default: componentModule['App'] as ComponentType<Record<string, unknown>> };
      }),
    [remoteName, loadRemoteModule],
  );

  return (
    <RemoteErrorBoundary key={remoteName} remoteName={remoteName}>
      <Suspense fallback={null}>
        <RemoteComponent {...props} />
      </Suspense>
    </RemoteErrorBoundary>
  );
}
