import { broadcastLocaleChange, getStoredLocale, onLocaleChange } from './locale-sync';

describe('locale-sync', () => {
  beforeEach(() => localStorage.clear());

  it('defaults to en when nothing is stored', () => {
    expect(getStoredLocale()).toBe('en');
  });

  it('ignores an invalid stored value and falls back to the default', () => {
    localStorage.setItem('mfe-pot-locale', 'de');
    expect(getStoredLocale()).toBe('en');
  });

  it('broadcastLocaleChange stores the locale and notifies listeners', () => {
    const received: string[] = [];
    const unsubscribe = onLocaleChange((locale) => received.push(locale));

    broadcastLocaleChange('fr');

    expect(getStoredLocale()).toBe('fr');
    expect(received).toEqual(['fr']);

    unsubscribe();
    broadcastLocaleChange('en');
    expect(received).toEqual(['fr']); // no longer listening
  });
});
