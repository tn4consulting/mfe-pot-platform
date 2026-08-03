import { share } from '@angular-architects/native-federation/config';

/**
 * The Native Federation `shared`/`skip`/`features` block every app's
 * federation.config.mjs needs -- see CLAUDE.md's federation-sharing
 * policy for what's shared and why (Angular core + RxJS structurally
 * required for singleton behavior; GCDS shared to avoid NG0912 component-ID
 * collisions between two federated bundles' Angular wrapper classes).
 *
 * This used to be hand-copied verbatim into all 5 apps' federation config
 * files. That was low-risk while they were one PR in one repo; once each
 * app lives in its own repo, 5 independent copies of the same singleton
 * version-pinning config is exactly how federation singleton mismatches
 * happen silently (app A bumps its Angular pin, app B doesn't, and the
 * shared-singleton contract between them silently breaks at runtime).
 * Every app's federation.config.mjs imports this instead.
 *
 * Deliberately plain JS, not TypeScript: federation.config.mjs is loaded
 * directly by Node (via Native Federation's own config loader), so this
 * package must be resolvable and runnable with zero build step -- no
 * outDir/dist-shape concerns, no build-ordering dependency for Nx to get
 * right before an app's serve/build target runs.
 */
const sharedSingleton = {
  singleton: true,
  strictVersion: true,
  requiredVersion: 'auto',
};

export const sharedFederationDependencies = share({
  '@angular/core': sharedSingleton,
  '@angular/common': sharedSingleton,
  '@angular/platform-browser': sharedSingleton,
  '@angular/router': sharedSingleton,
  '@angular/forms': sharedSingleton,
  rxjs: sharedSingleton,
  '@gcds-core/components': sharedSingleton,
  '@gcds-core/components-angular': sharedSingleton,
  // Same reasoning as GCDS: a framework-agnostic Stencil custom-elements
  // package, shared for the identical NG0912-avoidance reason once an
  // Angular wrapper (shared-ui-scds) is generated from it.
  '@tn4consulting/shared-ui-scds-core': sharedSingleton,
  // Same reasoning as GCDS above, not just "large and stable": this
  // package's whole purpose is DI-token identity (PAYMENT_HISTORY_WIDGET_LOADER,
  // REACT_MOUNTER, etc.) crossing a federation boundary. InjectionToken
  // equality is per-bundle-instance, so without sharing it as a singleton,
  // the shell and a widget-consuming remote each get their own separate
  // token instance and `inject(..., { optional: true })` silently resolves
  // to null on the consuming side -- no error, just the "unavailable"
  // fallback rendering forever. Confirmed broken this way post-polyrepo-
  // split (this package used to be a tsconfig-path lib, auto-shared by
  // Native Federation's sharedMappings; as a plain npm dependency it isn't).
  '@tn4consulting/shared-federation-runtime': sharedSingleton,
});

export const sharedFederationSkip = ['rxjs/ajax', 'rxjs/fetch', 'rxjs/testing', 'rxjs/webSocket'];

export const sharedFederationFeatures = {
  denseChunking: true,
};
