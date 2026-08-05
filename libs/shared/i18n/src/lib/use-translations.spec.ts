import { renderHook, waitFor } from '@testing-library/react';
import { useTranslations } from './use-translations';

describe('useTranslations', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    global.fetch = fetchMock;
  });

  afterEach(() => jest.resetAllMocks());

  it('fetches assets/i18n/<locale>.json relative to assetBaseUrl and flattens nested keys', async () => {
    fetchMock.mockResolvedValue({
      json: () =>
        Promise.resolve({
          reportingStatus: { nextReportDue: 'Next report due {{date}} ({{days}} days)' },
        }),
    });

    const { result } = renderHook(() => useTranslations('http://localhost:4202/', 'en'));

    await waitFor(() =>
      expect(result.current.t('reportingStatus.nextReportDue')).not.toBe('reportingStatus.nextReportDue'),
    );

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:4202/assets/i18n/en.json');
  });

  it('interpolates {{param}} placeholders into the fetched template', async () => {
    fetchMock.mockResolvedValue({
      json: () =>
        Promise.resolve({
          reportingStatus: { nextReportDue: 'Next report due {{date}} ({{days}} days)' },
        }),
    });

    const { result } = renderHook(() => useTranslations('http://localhost:4202/', 'en'));

    await waitFor(() =>
      expect(result.current.t('reportingStatus.nextReportDue', { date: 'Jan 1', days: 5 })).toBe(
        'Next report due Jan 1 (5 days)',
      ),
    );
  });

  it('falls back to the raw key when a translation is missing', async () => {
    fetchMock.mockResolvedValue({ json: () => Promise.resolve({}) });

    const { result } = renderHook(() => useTranslations('http://localhost:4202/', 'en'));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(result.current.t('unknown.key')).toBe('unknown.key');
  });

  it('falls back to empty translations when the fetch itself fails', async () => {
    fetchMock.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useTranslations('http://localhost:4202/', 'en'));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(result.current.t('any.key')).toBe('any.key');
  });
});
