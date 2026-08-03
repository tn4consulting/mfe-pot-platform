import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RemoteRouteHost } from './remote-route-host';
import { REMOTE_MODULE_LOADER, RemoteModuleLoader } from '../remote-module-loader.token';
import { REACT_MOUNTER, ReactMount, ReactMounter } from '../react-mounter.token';

const loadRemoteModuleMock = jest.fn<ReturnType<RemoteModuleLoader>, Parameters<RemoteModuleLoader>>();

@Component({ selector: 'lib-test-remote-app', standalone: true, template: 'remote content' })
class FakeRemoteApp {}

describe('RemoteRouteHost', () => {
  function setup(remoteName: string, remoteKind?: 'angular' | 'react', mountReact?: ReactMounter) {
    const providers = [
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { data: { remoteName, remoteKind } } },
      },
      { provide: REMOTE_MODULE_LOADER, useValue: loadRemoteModuleMock },
    ];
    if (mountReact) {
      providers.push({ provide: REACT_MOUNTER, useValue: mountReact });
    }
    return TestBed.configureTestingModule({
      imports: [RemoteRouteHost],
      providers,
    }).compileComponents();
  }

  afterEach(() => jest.resetAllMocks());

  it('mounts the remote component when loading succeeds', async () => {
    loadRemoteModuleMock.mockImplementation((_remote: string, exposed: string) =>
      exposed === './Component'
        ? Promise.resolve({ App: FakeRemoteApp })
        : Promise.resolve({ REMOTE_PROVIDERS: [] }),
    );

    await setup('dashboard');
    const fixture = TestBed.createComponent(RemoteRouteHost);
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('remote content');
    expect(fixture.componentInstance['loadError']()).toBe(false);
  });

  it('shows an error state when the remote fails to load', async () => {
    loadRemoteModuleMock.mockRejectedValue(new Error('remote unreachable'));

    await setup('job-bank');
    const fixture = TestBed.createComponent(RemoteRouteHost);
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    expect(fixture.componentInstance['loadError']()).toBe(true);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'temporarily unavailable',
    );
  });

  describe('remoteKind: react', () => {
    const FakeReactApp = () => null;

    it('mounts via the injected REACT_MOUNTER and never touches react/react-dom directly', async () => {
      loadRemoteModuleMock.mockResolvedValue({ App: FakeReactApp });
      const unmount = jest.fn();
      const mountReact = jest.fn<ReactMount, [HTMLElement, unknown]>().mockReturnValue({ unmount });

      await setup('job-bank', 'react', mountReact);
      const fixture = TestBed.createComponent(RemoteRouteHost);
      await fixture.componentInstance.ngOnInit();
      fixture.detectChanges();

      expect(mountReact).toHaveBeenCalledTimes(1);
      const [element, Component] = mountReact.mock.calls[0];
      expect(element).toBeInstanceOf(HTMLDivElement);
      expect(Component).toBe(FakeReactApp);
      expect(loadRemoteModuleMock).toHaveBeenCalledWith('job-bank', './Component');
      // No REMOTE_PROVIDERS load for a react-kind remote -- it does its own setup.
      expect(loadRemoteModuleMock).not.toHaveBeenCalledWith('job-bank', './RemoteProviders');
      expect(fixture.componentInstance['loadError']()).toBe(false);

      fixture.destroy();
      expect(unmount).toHaveBeenCalledTimes(1);
    });

    it('shows an error state when REACT_MOUNTER is not provided', async () => {
      loadRemoteModuleMock.mockResolvedValue({ App: FakeReactApp });

      await setup('job-bank', 'react');
      const fixture = TestBed.createComponent(RemoteRouteHost);
      await fixture.componentInstance.ngOnInit();
      fixture.detectChanges();

      expect(fixture.componentInstance['loadError']()).toBe(true);
    });

    it('does not mount if the host is destroyed while the remote module is still loading', async () => {
      let resolveLoad!: (value: Record<string, unknown>) => void;
      loadRemoteModuleMock.mockReturnValue(
        new Promise((resolve) => {
          resolveLoad = resolve;
        }),
      );
      const unmount = jest.fn();
      const mountReact = jest.fn<ReactMount, [HTMLElement, unknown]>().mockReturnValue({ unmount });

      await setup('job-bank', 'react', mountReact);
      const fixture = TestBed.createComponent(RemoteRouteHost);
      const initPromise = fixture.componentInstance.ngOnInit();

      fixture.destroy();
      resolveLoad({ App: FakeReactApp });
      await initPromise;

      expect(mountReact).not.toHaveBeenCalled();
    });
  });
});
