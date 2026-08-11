module.exports = {
  displayName: 'shared-remote-integrity',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  // jose ships ESM-only -- same reason @softarc/native-federation needs
  // this in jest.preset.js's default pattern (see its comment).
  transformIgnorePatterns: ['node_modules/(?!\\.pnpm|jose/|.*\\.mjs$)'],
  moduleFileExtensions: ['ts', 'js', 'json', 'html'],
  coverageDirectory: '../../../coverage/libs/shared/remote-integrity',
};
