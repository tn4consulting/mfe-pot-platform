import {
  Component,
  ElementRef,
  EnvironmentInjector,
  EnvironmentProviders,
  OnDestroy,
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
import { REACT_MOUNTER, ReactMount } from '../react-mounter.token';

/**
 * Mounts a routed remote's exposed `./Component`. Two mount contracts,
 * chosen via the route's `data.remoteKind` ('angular' | 'react', defaults
 * to 'angular' so every existing routed remote -- dashboard,
 * employment-insurance, employment-life-events -- needs zero changes):
 *
 * - 'angular' (the original, still-only path for those three remotes):
 *   the exposed module's own providers (from its exposed
 *   `./RemoteProviders`, if any) are applied via a dedicated child
 *   environment injector -- not the host's -- and the exported `App`
 *   Angular component class is mounted via `ViewContainerRef.createComponent`.
 *   Without this, a component loaded via a plain `loadComponent` runs
 *   entirely in the shell's injector, so a remote's own Transloco setup
 *   (its own translation files) is never actually used; this is what "each
 *   remote exports its own REMOTE_PROVIDERS" (see CLAUDE.md) means in
 *   practice.
 * - 'react': only `./Component` is loaded (a React remote does its own
 *   setup internally -- no `REMOTE_PROVIDERS`-equivalent, see CLAUDE.md's
 *   federation section for why). The exported `App` (a plain React
 *   function component, same exposed-module-name convention as the
 *   Angular remotes) is mounted into a plain `<div>` anchor -- not the
 *   `<ng-container>` used for the Angular path, which renders no real DOM
 *   node and so can't be a React mount target -- via the injected
 *   `REACT_MOUNTER` (see that token's own doc for why this library never
 *   imports `react`/`react-dom` directly). Angular never touches inside
 *   that `<div>`; React owns that subtree exclusively once mounted.
 *
 * Also owns failure handling for both paths: a remote that fails to load
 * degrades to an error message in its own route, not a crashed shell --
 * required for the "stop one remote, others keep working" proof to
 * actually hold up.
 */
@Component({
  selector: 'lib-remote-route-host',
  standalone: true,
  template: `
    @if (loadError()) {
      <p role="alert">This part of the page is temporarily unavailable.</p>
    }
    <ng-container #host></ng-container>
    <div #reactHost></div>
  `,
})
export class RemoteRouteHost implements OnInit, OnDestroy {
  @ViewChild('host', { read: ViewContainerRef, static: true })
  private host!: ViewContainerRef;

  @ViewChild('reactHost', { static: true })
  private reactHostEl!: ElementRef<HTMLDivElement>;

  private readonly route = inject(ActivatedRoute);
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly loadRemoteModule = inject(REMOTE_MODULE_LOADER);
  private readonly mountReact = inject(REACT_MOUNTER, { optional: true });

  protected readonly loadError = signal(false);

  private reactMount: ReactMount | undefined;
  private destroyed = false;

  async ngOnInit(): Promise<void> {
    const remoteName = this.route.snapshot.data['remoteName'] as string;
    const remoteKind = (this.route.snapshot.data['remoteKind'] as 'angular' | 'react') ?? 'angular';

    try {
      if (remoteKind === 'react') {
        await this.mountReactRemote(remoteName);
      } else {
        await this.mountAngularRemote(remoteName);
      }
    } catch (err) {
      console.error(`Failed to load remote "${remoteName}"`, err);
      this.loadError.set(true);
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.reactMount?.unmount();
  }

  private async mountAngularRemote(remoteName: string): Promise<void> {
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
  }

  private async mountReactRemote(remoteName: string): Promise<void> {
    if (!this.mountReact) {
      throw new Error(
        'REACT_MOUNTER is not provided -- a react-kind route needs the host app to provide it (see apps/shell/src/app/app.config.ts).',
      );
    }
    const componentModule = await this.loadRemoteModule(remoteName, './Component');
    // Guards against navigating away from this route while the remote's
    // module is still loading: ngOnDestroy may already have run by the
    // time this await resolves, and mounting into a detached element at
    // that point would leak a React root nothing will ever unmount.
    if (this.destroyed) {
      return;
    }
    this.reactMount = this.mountReact(this.reactHostEl.nativeElement, componentModule['App']);
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
