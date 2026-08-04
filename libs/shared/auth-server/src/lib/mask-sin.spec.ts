import { maskSin } from './mask-sin';

describe('maskSin', () => {
  it('masks all but the last 3 digits, preserving dashes', () => {
    expect(maskSin('123-456-789')).toBe('•••-•••-789');
  });

  it('masks all but the last 3 digits with no separators', () => {
    expect(maskSin('123456789')).toBe('••••••789');
  });

  it('leaves a value with 3 or fewer digits fully visible', () => {
    expect(maskSin('789')).toBe('789');
  });
});
