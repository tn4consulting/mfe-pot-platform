import { fillTemplate } from './interpolate';

describe('fillTemplate', () => {
  it('replaces placeholders with provided values', () => {
    expect(fillTemplate('Claim {id}', { id: 'A123' })).toBe('Claim A123');
  });

  it('replaces multiple placeholders', () => {
    expect(fillTemplate('Status: {status}, weekly benefit: ${amount}.', { status: 'active', amount: '638.00' })).toBe(
      'Status: active, weekly benefit: $638.00.',
    );
  });

  it('leaves an unmatched placeholder untouched', () => {
    expect(fillTemplate('Claim {id}', {})).toBe('Claim {id}');
  });
});
