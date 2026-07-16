module.exports = {
  root: true,
  extends: ['@react-native', 'eslint-config-prettier'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': ['error', {}, { usePrettierrc: true }],
    'no-console': ['warn', { allow: ['warn', 'error', 'log'] }],
    'react/react-in-jsx-scope': 'off',
    'no-void': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
  ignorePatterns: [
    'node_modules/',
    'lib/',
    'coverage/',
    'example/node_modules/',
    'example/android/',
    'example/ios/',
    'android/build/',
    'ios/build/',
  ],
  overrides: [
    {
      files: ['*.test.ts', '*.test.tsx'],
      env: { jest: true },
    },
  ],
};
