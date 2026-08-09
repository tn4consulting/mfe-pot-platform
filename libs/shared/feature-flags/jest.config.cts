module.exports = {
  displayName: 'shared-feature-flags',
  preset: '../../../jest.preset.js',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../../coverage/libs/shared/feature-flags',
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};
