import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RemoteRouteHost } from './remote-route-host';
import { REMOTE_MODULE_LOADER, RemoteModuleLoader } from '../remote-module-loader.token';

const loadRemoteModuleMock = jest.fn<ReturnType<RemoteModuleLoader>, Parameters<RemoteModuleLoader>>();

@Component({ selector: 'lib-test-remote-app', standalone: true, template: 'remote content' })
class FakeRemoteApp {}

describe('RemoteRouteHost', () => {
  function setup(remoteName: string) {
    return TestBed.configureTestingModule({
      imports: [RemoteRouteHost],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { data: { remoteName } } },
        },
        { provide: REMOTE_MODULE_LOADER, useValue: loadRemoteModuleMock },
      ],
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
});
