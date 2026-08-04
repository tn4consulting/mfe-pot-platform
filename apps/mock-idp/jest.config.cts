module.exports = {
  displayName: 'mock-idp',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  // jose ships ESM-only -- see libs/shared/auth-server/jest.config.cts's
  // identical override for why.
  transformIgnorePatterns: ['node_modules/(?!\\.pnpm|jose/|.*\\.mjs$)'],
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/mock-idp',
};
