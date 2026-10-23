// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');

// src가 demo를 import하지 않게 한다: 가짜는 demo/overrides.js가 번들 때 바꿔 끼울 뿐이다
const noDemo = {
  group: ['**/demo', '**/demo/**'],
  message: 'src는 demo를 import하지 않는다(demo/overrides.js가 바꿔 끼운다).',
};

// 기기·바깥과 닿는 것은 src/platform(services·ui)에서만 쓴다. 웹 데모는 그 두 파일만 바꿔 끼운다
const viaPlatform = (what) => `${what}: @/platform에서 꺼내 쓴다(웹 데모가 그 파일을 바꿔 끼운다).`;
const platformOnly = [
  ...[
    'expo-camera',
    'expo-clipboard',
    'expo-screen-capture',
    'expo-secure-store',
    'expo-sqlite',
    'react-native-qrcode-svg',
    'react-native-safe-area-context',
  ].map((name) => ({ name, message: viaPlatform(name) })),
  { name: 'react-native', importNames: ['Share', 'Linking'], message: viaPlatform('공유·링크') },
  { name: 'ethers', importNames: ['randomBytes'], message: viaPlatform('난수') },
];
const platformInside = {
  group: ['**/platform/store'],
  message: 'platform 안쪽 파일은 @/platform/services로만 꺼낸다(웹 데모가 services만 바꾼다).',
};
// 복구 문구가 지나가는 보안 저장소는 core/keys만 쓴다 (docs/PROJECT.md 보안 모델)
const secureStoreOnlyInKeys = {
  group: ['**/platform/services'],
  importNames: ['secureStore'],
  message: 'secureStore는 core/keys만 쓴다.',
};
// core는 React를 모른다
const noUiInCore = {
  group: ['**/platform/ui'],
  message: 'core는 React를 쓰는 platform/ui를 import하지 않는다.',
};
const restrict = (...patterns) => [
  'error',
  { paths: platformOnly, patterns: [noDemo, platformInside, ...patterns] },
];

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
    rules: { 'no-restricted-imports': restrict(secureStoreOnlyInKeys) },
  },
  {
    files: ['src/core/**/*.ts'],
    rules: { 'no-restricted-imports': restrict(secureStoreOnlyInKeys, noUiInCore) },
  },
  {
    files: ['src/core/keys/**/*.ts'],
    rules: { 'no-restricted-imports': restrict(noUiInCore) },
  },
]);
