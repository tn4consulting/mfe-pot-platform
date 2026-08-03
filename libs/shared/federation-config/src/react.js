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

// Framework-agnostic layer only (@gcds-core/components) -- no Angular
// wrapper (@gcds-core/components-angular) available to a React remote.
// job-bank doesn't use this yet; declared now so the door is open without
// forcing GCDS-singleton config onto every future React remote's config
// before it actually renders any GCDS component.
export const sharedGcdsFederationDependency = share({
  '@gcds-core/components': sharedSingleton,
});
