import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { RemoteModuleLoaderContext } from './remote-module-loader.context';
import { WidgetRegistryContext, useWidgetLoader } from './widget-registry';

function Probe({ widgetId }: { widgetId: string }) {
  const loader = useWidgetLoader(widgetId);
  const [state, setState] = React.useState('pending');
  React.useEffect(() => {
    if (!loader) {
      setState('no loader');
      return;
    }
    loader().then(() => setState('has loader'));
  }, [loader]);
  return <p>{state}</p>;
}

describe('useWidgetLoader', () => {
  it('returns undefined (does not throw) when there is no RemoteModuleLoaderContext at all -- e.g. this remote running standalone with no shell above it', () => {
    render(<Probe widgetId="payment-history" />);
    expect(screen.getByText('no loader')).toBeInTheDocument();
  });

  it('returns undefined when no registry has been provided', () => {
    render(
      <RemoteModuleLoaderContext.Provider value={jest.fn()}>
        <Probe widgetId="payment-history" />
      </RemoteModuleLoaderContext.Provider>,
    );
    expect(screen.getByText('no loader')).toBeInTheDocument();
  });

  it('returns undefined when the registry has no entry for the requested id', () => {
    render(
      <RemoteModuleLoaderContext.Provider value={jest.fn()}>
        <WidgetRegistryContext.Provider value={{}}>
          <Probe widgetId="payment-history" />
        </WidgetRegistryContext.Provider>
      </RemoteModuleLoaderContext.Provider>,
    );
    expect(screen.getByText('no loader')).toBeInTheDocument();
  });

  it('resolves a registered widget id via the remote module loader', async () => {
    const loadRemoteModule = jest
      .fn()
      .mockResolvedValue({ DashboardFeaturePaymentHistory: () => null });

    render(
      <RemoteModuleLoaderContext.Provider value={loadRemoteModule}>
        <WidgetRegistryContext.Provider
          value={{
            'payment-history': {
              remoteName: 'dashboard-mfe',
              exposedModule: './PaymentHistoryWidget',
              exportName: 'DashboardFeaturePaymentHistory',
            },
          }}
        >
          <Probe widgetId="payment-history" />
        </WidgetRegistryContext.Provider>
      </RemoteModuleLoaderContext.Provider>,
    );

    await waitFor(() => expect(screen.getByText('has loader')).toBeInTheDocument());
    expect(loadRemoteModule).toHaveBeenCalledWith('dashboard-mfe', './PaymentHistoryWidget');
  });
});
