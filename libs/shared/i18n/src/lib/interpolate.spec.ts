import { interpolate } from './interpolate';

describe('interpolate', () => {
  it('returns the template unchanged when there are no params', () => {
    expect(interpolate('Next report due {{date}}')).toBe('Next report due {{date}}');
  });

  it('replaces every matching {{key}} placeholder', () => {
    expect(interpolate('Next report due {{date}} ({{days}} days)', { date: 'Jan 1', days: 5 })).toBe(
      'Next report due Jan 1 (5 days)',
    );
  });

  it('leaves an unmatched placeholder as-is rather than blanking it', () => {
    expect(interpolate('Hello {{name}}', {})).toBe('Hello {{name}}');
  });
});
