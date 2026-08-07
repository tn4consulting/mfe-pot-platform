import { share } from '@softarc/native-federation/config';

/**
 * React/GCDS shared-singleton config for a React remote (currently just
 * job-bank) and the shell (which needs `react`/`react-dom` declared too --
 * its own bundle mounts a React remote's exported `App` via
 * `REACT_MOUNTER`, calling `createRoot`/`createElement` itself, so it must
 * share the same React instance the remote's bundle uses or get an
 * "invalid hook call" against a second, disconnected copy).
 *
 * Deliberately a SEPARATE module from `./index.js`, not more exports added
 * there -- `share()` is evaluated eagerly, at import time, and throws if a
 * listed package isn't actually installed in the consuming app's
 * package.json (traced into @softarc/native-federation's own
 * `version-lookup.js`: `Shared Dependency ${key} has
 * requiredVersion:'auto'. However, this dependency is not found in your
 * package.json`). `./index.js`'s `sharedFederationDependencies` calls
 * `share({...'@angular/core'...})` at module top level, so any import from
 * that module -- including just to reach a sibling export -- throws before
 * even being reached, in a job-bank that no longer has Angular installed.
 * Importing `@softarc/native-federation/config` here (the framework-
 * agnostic core the Angular package itself wraps) rather than
 * `@angular-architects/native-federation/config` (as `./index.js` does)
 * for the same reason: a pure-React remote shouldn't need the Angular
 * wrapper package installed just to build its federation config.
 */
const sharedSingleton = {
  singleton: true,
  strictVersion: true,
  requiredVersion: 'auto',
  // `includeSecondaries` (native federation's default: true) auto-discovers
  // and externalizes every subpath a shared package declares in its own
  // package.json `exports` map -- for 'react' that's react/jsx-runtime,
  // react/jsx-dev-runtime, react/compiler-runtime, etc.; for 'react-dom'
  // it's react-dom/server, /static, /profiling, /test-utils and more (all
  // observed directly in a real build's resulting import map). None of
  // those need to be *shared* -- only the three explicit entries below are
  // ever actually imported here -- and 'react/jsx-runtime' specifically
  // MUST NOT be auto-included: confirmed the hard way against a real
  // federated mount that native federation's shared-chunk bundler only
  // re-exports named exports it can see literally requested by name in
  // scanned TypeScript source, and react/jsx-runtime's real consumers are
  // the JSX transform's own synthesized (post-parse) imports, invisible to
  // that scan -- the resulting shared chunk ends up with only a default
  // export, so a real consumer's `import { jsx, jsxs, Fragment } from
  // "react/jsx-runtime"` fails at runtime ("does not provide an export
  // named 'Fragment'") regardless of what's declared shareable. Turning
  // off auto-discovery entirely sidesteps this: jsx-runtime just bundles
  // inline per-remote instead, which is safe since its jsx()/jsxs()/
  // Fragment are thin wrappers deriving their actual behavior (element
  // creation, the Fragment marker symbol) from the 'react' package's own
  // shared internal state at runtime, not from any state of their own --
  // two independently bundled copies of the wrapper still agree, as long
  // as 'react' itself (shared below) is the same singleton instance either
  // copy calls into.
  includeSecondaries: false,
};

export const sharedReactFederationDependencies = share({
  react: sharedSingleton,
  'react-dom': sharedSingleton,
  'react-dom/client': sharedSingleton,
});

/**
 * A SEPARATE export from `sharedReactFederationDependencies` above, for the
 * identical eager-`share()`-throw reason this file's own top doc explains
 * for why it's a separate module from `./index.js`: job-bank doesn't (and
 * shouldn't need to) have `@tn4consulting/shared-federation-runtime` in its
 * own package.json -- it's a widget *source* (exposes `./JobApplicationsWidget`
 * for dashboard to load), never a cross-remote widget *consumer*, so it
 * never imports this package at all. Folding it into
 * `sharedReactFederationDependencies` (which job-bank already spreads
 * wholesale) would make job-bank's federation config throw at import time
 * for a dependency it doesn't have and doesn't need.
 *
 * Only a host that actually provides/consumes `RemoteModuleLoaderContext`
 * or a widget-loader Context needs this -- today that's the shell once it
 * converts to React. Same reasoning as `./index.js`'s inclusion of this
 * package for the Angular-DI-token version: its whole purpose (Context
 * identity crossing a federation boundary) requires every participant to
 * resolve the exact same module instance, exactly like an Angular
 * `InjectionToken`'s per-bundle identity -- without sharing it as a
 * singleton, the shell and a widget-consuming remote each get their own
 * separate Context instance, and a remote's `useContext` call against its
 * own copy silently resolves to that Context's default (`undefined`) no
 * matter what the shell's copy was given.
 */
export const sharedFederationRuntimeDependency = share({
  '@tn4consulting/shared-federation-runtime': sharedSingleton,
});

// Framework-agnostic custom-element layer a React remote uses directly --
// formerly covered @gcds-core/components too (renamed from
// sharedGcdsFederationDependency), but GCDS has been removed from the
// family entirely: shared-ui-scds-core is now a self-contained design
// system with no GCDS dependency of its own, so this export shrank to just
// the one package. Every importer (job-bank, shell, dashboard) updated in
// the same change that renamed this export -- a rename is already a
// breaking change for this module's consumers, so there's no reason to
// keep the old GCDS-flavored name around it.
export const sharedUiScdsCoreFederationDependency = share({
  '@tn4consulting/shared-ui-scds-core': sharedSingleton,
});
