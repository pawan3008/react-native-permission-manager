/** @type {import('jest').Config} */
module.exports = {
  preset: 'react-native',
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  setupFiles: ['<rootDir>/__tests__/setup.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  // Coverage gates are enforced once real implementations + unit tests exist.
  // Use `yarn test:coverage` when implementing; keep default `yarn test` green for scaffolding.
  collectCoverage: false,
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/index.ts', '!src/native/**'],
  coverageDirectory: '<rootDir>/coverage',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  transformIgnorePatterns: ['node_modules/(?!(react-native|@react-native)/)'],
  moduleNameMapper: {
    '^react-native-permission-manager$': '<rootDir>/src/index.ts',
  },
};
