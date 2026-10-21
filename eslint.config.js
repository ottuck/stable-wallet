// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*', '.expo/*', 'expo-env.d.ts'],
  },
  {
    // secret이 로그로 새지 않게 console 사용을 막는다 (docs/PROJECT.md 보안 모델)
    files: ['src/**/*.{ts,tsx}'],
    rules: { 'no-console': 'error' },
  },
]);
