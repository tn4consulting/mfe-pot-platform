import {
  Component,
  EnvironmentInjector,
  EnvironmentProviders,
  OnInit,
  Provider,
  Type,
  ViewChild,
  ViewContainerRef,
  createEnvironmentInjector,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { REMOTE_MODULE_LOADER } from '../remote-module-loader.token';

/**
 * Mounts a routed remote's exposed `./Component` with ITS OWN providers
 * (from its exposed `./RemoteProviders`, if any) applied via a dedicated
 * child environment injector -- not the host's. Without this, a component
 * loaded via a plain `loadComponent` runs entirely in the shell's injector,
 * so a remote's own Transloco setup (its own translation files) is never
 * actually used; this is what "each remote exports its own REMOTE_PROVIDERS"
 * (see CLAUDE.md) means in practice.
 *
 * Also owns failure handling: a remote that fails to load degrades to an
 * error message in its own route, not a crashed shell -- required for the
 * "stop one remote, others keep working" proof to actually hold up.
 */
@Component({
  selector: 'lib-remote-route-host',
  standalone: true,
  template: `
    @if (loadError()) {
      <p role="alert">This part of the page is temporarily unavailable.</p>
    }
    <ng-container #host></ng-container>
  `,
})
export class RemoteRouteHost implements OnInit {
  @ViewChild('host', { read: ViewContainerRef, static: true })
  private host!: ViewContainerRef;

  private readonly route = inject(ActivatedRoute);
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly loadRemoteModule = inject(REMOTE_MODULE_LOADER);

  protected readonly loadError = signal(false);

  async ngOnInit(): Promise<void> {
    const remoteName = this.route.snapshot.data['remoteName'] as string;

    try {
      const [componentModule, providers] = await Promise.all([
        this.loadRemoteModule(remoteName, './Component'),
        this.loadRemoteProviders(remoteName),
      ]);

      const childInjector = providers.length
        ? createEnvironmentInjector(providers, this.envInjector)
        : this.envInjector;

      this.host.createComponent(componentModule['App'] as Type<unknown>, {
        environmentInjector: childInjector,
      });
    } catch (err) {
      console.error(`Failed to load remote "${remoteName}"`, err);
      this.loadError.set(true);
    }
  }

  private async loadRemoteProviders(
    remoteName: string,
  ): Promise<(Provider | EnvironmentProviders)[]> {
    try {
      const module = await this.loadRemoteModule(remoteName, './RemoteProviders');
      // A remote's REMOTE_PROVIDERS may itself be a Promise -- see
      // shared-runtime-config's fetchRuntimeConfig: any provider built
      // from this app's own BFF/service URLs needs to resolve them via an
      // async fetch of its own env.js (window.__mfePotEnv only ever
      // carries the *host's* values here, not this remote's), so
      // REMOTE_PROVIDERS can't always be a plain synchronously-built
      // array anymore. `await` on a non-Promise value just resolves
      // immediately, so this stays compatible with remotes that don't
      // need the async path.
      const providers = await (module['REMOTE_PROVIDERS'] as
        | (Provider | EnvironmentProviders)[]
        | Promise<(Provider | EnvironmentProviders)[]>
        | undefined);
      return providers ?? [];
    } catch {
      // Not every remote exposes its own providers -- that's fine.
      return [];
    }
  }
}
