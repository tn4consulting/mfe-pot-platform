import { StaticFeatureFlags } from './static-feature-flags';

describe('StaticFeatureFlags', () => {
  it('defaults an unknown flag to false', async () => {
    const flags = new StaticFeatureFlags();
    await expect(flags.isEnabled('dashboard-overview-cross-domain-widgets')).resolves.toBe(false);
  });

  it('returns an explicit override', async () => {
    const flags = new StaticFeatureFlags({ 'dashboard-overview-cross-domain-widgets': true });
    await expect(flags.isEnabled('dashboard-overview-cross-domain-widgets')).resolves.toBe(true);
  });

  it('ignores context, since the static implementation has no targeting rules', async () => {
    const flags = new StaticFeatureFlags({ 'some-flag': true });
    await expect(flags.isEnabled('some-flag', { userId: 'sub-123' })).resolves.toBe(true);
  });

  it('defaults an unknown flag\'s variant to null', async () => {
    const flags = new StaticFeatureFlags();
    await expect(flags.getVariant('dashboard-whats-new-message')).resolves.toBeNull();
  });

  it('returns an explicit variant override', async () => {
    const variant = { name: 'updated-message', payload: { type: 'string', value: 'hello' } };
    const flags = new StaticFeatureFlags({}, { 'dashboard-whats-new-message': variant });
    await expect(flags.getVariant('dashboard-whats-new-message')).resolves.toEqual(variant);
  });
});
