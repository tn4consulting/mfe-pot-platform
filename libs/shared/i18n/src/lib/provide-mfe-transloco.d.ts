import { Provider, EnvironmentProviders } from '@angular/core';
/**
 * Sets up this app's own Transloco instance (own translation files, own
 * loader) and keeps it in sync with the cross-remote active locale. Each
 * app calls this in its own bootstrap config with its OWN computed asset
 * base URL -- see I18N_ASSET_BASE_URL's doc comment for why that can't live
 * in this shared lib.
 *
 * Two deliberate departures from the "obvious" Transloco setup, both needed
 * because a remote mounted by `RemoteRouteHost` runs under a child
 * `EnvironmentInjector` (see remote-route-host.ts), not the true app root:
 *  - `TranslocoService` is re-provided explicitly. The library declares it
 *    `providedIn: 'root'`, so without an explicit provider here, every
 *    remote would resolve the SAME singleton instance (whichever one the
 *    shell constructed first) instead of getting its own, and would
 *    silently keep using the shell's loader/config/asset base URL.
 *  - Locale-sync uses `ENVIRONMENT_INITIALIZER`, not `provideAppInitializer`
 *    (which is `APP_INITIALIZER` under the hood): `APP_INITIALIZER`
 *    callbacks only run for the injector `bootstrapApplication` creates,
 *    never for one created later via `createEnvironmentInjector` -- so a
 *    federated remote's locale-sync subscription would just never run.
 *    `ENVIRONMENT_INITIALIZER` runs for any environment injector, root or
 *    child, which is what's actually needed here.
 */
export declare function provideMfeTransloco(assetBaseUrl: string): (Provider | EnvironmentProviders)[];
//# sourceMappingURL=provide-mfe-transloco.d.ts.map