// Deliberately NOT extending the shared `../../../jest.preset.js`: that
// preset's own `transform` (ts-jest, tsconfig.spec.json) gets merged
// alongside (not replaced by) whatever this file sets -- Jest's
// preset-merging normalizes `transform` into an array and keeps both
// sources' entries rather than letting the local config fully override it,
// confirmed via `jest --showConfig`. This package needs a plain babel
// transform instead (see babel.config.cjs): its tests import the *built*
// dist-custom-elements output (real ESM), which ts-jest won't touch.
module.exports = {
  displayName: 'shared-ui-scds-core',
  testEnvironment: 'jsdom',
  coverageDirectory: '../../../coverage/libs/shared/ui-scds-core',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  transform: {
    '^.+\\.(ts|js)$': 'babel-jest',
  },
  transformIgnorePatterns: [],
};
