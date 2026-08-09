import * as React from 'react';
import { act } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { UnleashClient } from 'unleash-proxy-client';
import {
  __resetBrowserFeatureFlagsForTests,
  initBrowserFeatureFlags,
  useFeatureFlag,
} from './use-feature-flag';

jest.mock('unleash-proxy-client', () => ({
  UnleashClient: jest.fn(),
}));

function Probe({ flagKey, fallback }: { flagKey: string; fallback?: boolean }) {
  const enabled = useFeatureFlag(flagKey, fallback);
  return <p>{enabled ? 'on' : 'off'}</p>;
}

describe('useFeatureFlag', () => {
  beforeEach(() => {
    __resetBrowserFeatureFlagsForTests();
    (UnleashClient as jest.Mock).mockReset();
  });

  it('returns the fallback when initBrowserFeatureFlags was never called', () => {
    render(<Probe flagKey="some-flag" fallback={false} />);
    expect(screen.getByText('off')).toBeInTheDocument();
  });

  it('returns the fallback when frontendApiUrl is undefined -- e.g. plain nx serve with no local Unleash', () => {
    initBrowserFeatureFlags({
      appName: 'test-app',
      frontendApiUrl: undefined,
      frontendApiToken: 'token',
    });

    render(<Probe flagKey="some-flag" fallback={true} />);
    expect(screen.getByText('on')).toBeInTheDocument();
  });

  it('resolves to the client state once start() resolves, and updates on the client\'s own "update" event', async () => {
    const listeners: Record<string, () => void> = {};
    const start = jest.fn().mockResolvedValue(undefined);
    const isEnabled = jest.fn().mockReturnValue(true);
    const on = jest.fn((event: string, handler: () => void) => {
      listeners[event] = handler;
    });
    const off = jest.fn();
    (UnleashClient as jest.Mock).mockImplementation(() => ({ start, isEnabled, on, off }));

    initBrowserFeatureFlags({
      appName: 'test-app',
      frontendApiUrl: 'http://unleash.mfe-pot.local/api/frontend',
      frontendApiToken: 'token',
    });

    render(<Probe flagKey="dashboard-overview-cross-domain-widgets" fallback={false} />);

    await waitFor(() => expect(screen.getByText('on')).toBeInTheDocument());

    isEnabled.mockReturnValue(false);
    act(() => {
      listeners['update']?.();
    });

    await waitFor(() => expect(screen.getByText('off')).toBeInTheDocument());
  });
});
