import { render, screen } from '@testing-library/react';
import {
  PaymentHistoryWidgetLoaderContext,
  usePaymentHistoryWidgetLoader,
} from './payment-history-widget-loader.context';

function Probe() {
  const loader = usePaymentHistoryWidgetLoader();
  return <p>{loader ? 'has loader' : 'no loader'}</p>;
}

describe('usePaymentHistoryWidgetLoader', () => {
  it('returns undefined when no host has provided a value', () => {
    render(<Probe />);
    expect(screen.getByText('no loader')).toBeInTheDocument();
  });

  it('returns the provided loader', () => {
    const loader = jest.fn().mockResolvedValue({ component: () => null });
    render(
      <PaymentHistoryWidgetLoaderContext.Provider value={loader}>
        <Probe />
      </PaymentHistoryWidgetLoaderContext.Provider>,
    );
    expect(screen.getByText('has loader')).toBeInTheDocument();
  });
});
