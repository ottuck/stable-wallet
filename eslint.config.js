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
    // 앱 코드는 데모를 모른다: 가짜는 demo/overrides.js가 번들 때 바꿔 끼울 뿐이다
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-console': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/demo', '**/demo/**'],
              message: 'src는 demo를 import하지 않는다(demo/overrides.js가 바꿔 끼운다).',
            },
          ],
        },
      ],
    },
  },
]);
