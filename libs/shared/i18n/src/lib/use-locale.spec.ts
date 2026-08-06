import { act, renderHook } from '@testing-library/react';
import { broadcastLocaleChange } from './locale-sync';
import { useLocale } from './use-locale';

describe('useLocale', () => {
  afterEach(() => localStorage.clear());

  it('defaults to "en" when nothing is stored', () => {
    const { result } = renderHook(() => useLocale());
    expect(result.current).toBe('en');
  });

  it('reads the locale already stored by a prior broadcast', () => {
    localStorage.setItem('mfe-pot-locale', 'fr');
    const { result } = renderHook(() => useLocale());
    expect(result.current).toBe('fr');
  });

  it('reacts to a cross-remote locale-change broadcast', () => {
    const { result } = renderHook(() => useLocale());
    expect(result.current).toBe('en');

    act(() => broadcastLocaleChange('fr'));

    expect(result.current).toBe('fr');
  });
});
