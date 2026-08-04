module.exports = {
  displayName: 'shared-auth-server',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  // jose ships ESM-only -- same reason @angular-architects/@softarc/@gcds-core
  // need this in jest.preset.js's default pattern (see its comment).
  transformIgnorePatterns: ['node_modules/(?!\\.pnpm|jose/|.*\\.mjs$)'],
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/shared/auth-server',
};
