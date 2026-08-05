import { Component, ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { RemoteModuleLoaderContext, RemoteModuleLoader } from '../remote-module-loader.context';
import { RemoteRouteHost } from './remote-route-host';

// A missing Context value is a host mis-wiring bug, not a remote-loading
// failure the internal RemoteErrorBoundary should paper over, so
// RemoteRouteHost lets it throw straight out of render with no boundary of
// its own. Testing that requires supplying one from the test itself --
// React's own default reporting for an unhandled render-phase error isn't
// consistent enough across environments to assert on directly.
class Catcher extends Component<{ children: ReactNode }, { message: string | null }> {
  override state: { message: string | null } = { message: null };

  static getDerivedStateFromError(error: Error): { message: string } {
    return { message: error.message };
  }

  override render(): ReactNode {
    return this.state.message ?? this.props.children;
  }
}

const loadRemoteModuleMock = jest.fn<
  ReturnType<RemoteModuleLoader>,
  Parameters<RemoteModuleLoader>
>();

function FakeRemoteApp() {
  return <p>remote content</p>;
}

function renderHost(remoteName: string, loader: RemoteModuleLoader | undefined = loadRemoteModuleMock) {
  return render(
    <RemoteModuleLoaderContext.Provider value={loader}>
      <RemoteRouteHost remoteName={remoteName} />
    </RemoteModuleLoaderContext.Provider>,
  );
}

describe('RemoteRouteHost', () => {
  afterEach(() => jest.resetAllMocks());

  it('mounts the remote component when loading succeeds', async () => {
    loadRemoteModuleMock.mockResolvedValue({ App: FakeRemoteApp });

    renderHost('dashboard');

    expect(await screen.findByText('remote content')).toBeInTheDocument();
    expect(loadRemoteModuleMock).toHaveBeenCalledWith('dashboard', './Component');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows an error state when the remote fails to load', async () => {
    loadRemoteModuleMock.mockRejectedValue(new Error('remote unreachable'));
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    renderHost('job-bank');

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('temporarily unavailable'),
    );
  });

  it('reloads via a fresh lazy import when remoteName changes', async () => {
    loadRemoteModuleMock.mockImplementation((remoteName) =>
      Promise.resolve({
        App: () => <p>content from {remoteName}</p>,
      }),
    );

    const { rerender } = render(
      <RemoteModuleLoaderContext.Provider value={loadRemoteModuleMock}>
        <RemoteRouteHost remoteName="dashboard" />
      </RemoteModuleLoaderContext.Provider>,
    );
    expect(await screen.findByText('content from dashboard')).toBeInTheDocument();

    rerender(
      <RemoteModuleLoaderContext.Provider value={loadRemoteModuleMock}>
        <RemoteRouteHost remoteName="job-bank" />
      </RemoteModuleLoaderContext.Provider>,
    );

    expect(await screen.findByText('content from job-bank')).toBeInTheDocument();
    expect(loadRemoteModuleMock).toHaveBeenCalledWith('job-bank', './Component');
  });

  it('throws if RemoteModuleLoaderContext has no value -- a setup error, not a runtime remote failure', () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <Catcher>
        <RemoteModuleLoaderContext.Provider value={undefined}>
          <RemoteRouteHost remoteName="dashboard" />
        </RemoteModuleLoaderContext.Provider>
      </Catcher>,
    );

    expect(screen.getByText(/RemoteModuleLoaderContext has no value/)).toBeInTheDocument();
  });
});
