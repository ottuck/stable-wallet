// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');

// src가 demo를 import하지 않게 한다: 가짜는 demo/overrides.js가 번들 때 바꿔 끼울 뿐이다
const noDemo = {
  group: ['**/demo', '**/demo/**'],
  message: 'src는 demo를 import하지 않는다(demo/overrides.js가 바꿔 끼운다).',
};

// 기기·바깥과 닿는 패키지는 src/platform에서만 쓴다. 웹 데모는 platform 파일만 바꿔 끼운다
const platformOnly = [
  'expo-camera',
  'expo-screen-capture',
  'react-native-qrcode-svg',
  'react-native-safe-area-context',
].map((name) => ({
  name,
  message: `${name}은 @/platform에서 꺼내 쓴다(웹 데모가 그 파일을 바꿔 끼운다).`,
}));

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*', '.expo/*', 'expo-env.d.ts'],
  },
  {
    // secret이 로그로 새지 않게 console 사용을 막는다 (docs/PROJECT.md 보안 모델)
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-console': 'error',
      'no-restricted-imports': ['error', { patterns: [noDemo] }],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/platform/**'],
    rules: {
      'no-restricted-imports': ['error', { paths: platformOnly, patterns: [noDemo] }],
    },
  },
]);
