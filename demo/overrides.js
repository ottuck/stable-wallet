// 데모 모드(STABLE_WALLET_DEMO=1)에서 Metro가 실제 파일 대신 demo/ 의 가짜 파일을 쓰게 한다.
// 바꾸는 곳은 앱 바깥과 닿는 경계뿐이다: 저장소(SQLite), 키 보관(secure-store), RPC 연결, 웹에 없는 스크린샷 차단 API,
// 그리고 공개 웹 데모에서 막아야 하는 것(진짜 복구 문구 생성·입력, 카메라, 클립보드, 주소 QR·공유, 가짜 거래의 탐색기 링크).
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'src') + path.sep;
const stub = (name) => ({ type: 'sourceFile', filePath: path.resolve(__dirname, 'stubs', name) });
const swap = (real, fake) => [path.resolve(root, real), fake];

/** 앱 파일 → 가짜 파일 */
const files = new Map([
  swap('src/core/db.ts', 'db.ts'),
  swap('src/core/history.ts', 'history.ts'),
  swap('src/core/keys/vault.ts', 'vault.ts'),
  swap('src/core/keys/mnemonic.ts', 'mnemonic.ts'),
  swap('src/core/evm/provider.ts', 'provider.ts'),
  swap('src/features/use-secret-screen.ts', 'use-secret-screen.ts'),
  swap('src/features/format.ts', 'format.ts'),
]);

/** 앱 코드가 부르는 패키지 → 가짜 파일 */
const packages = new Map([
  ['expo-camera', 'camera.tsx'],
  ['expo-clipboard', 'clipboard.ts'],
  ['react-native-qrcode-svg', 'qrcode.tsx'],
]);

/**
 * 이 화면이 부르는 react-native의 한 가지만 가짜로. 웹에서는 babel이
 * `import { TextInput } from 'react-native'`를 `react-native-web/dist/exports/TextInput`으로 바꿔 부르므로 둘 다 받는다.
 */
const screens = new Map([
  [path.resolve(root, 'src/app/import.tsx'), { name: 'TextInput', file: 'import-input.tsx' }],
  [path.resolve(root, 'src/app/receive.tsx'), { name: 'Share', file: 'receive-share.ts' }],
]);

const entry = path.resolve(__dirname, 'entry.tsx');

/** 기본 해석 결과를 받아 데모용 파일로 바꿔 돌려준다. origin은 import하는 파일이다. */
function redirect(moduleName, resolution, origin) {
  if (moduleName === 'expo-router/entry') return { type: 'sourceFile', filePath: entry };
  // 가짜 파일은 진짜를 감싸 쓰므로, 앱 코드(src)에서 부를 때만 바꾼다
  if (!origin || !origin.startsWith(src)) return resolution;
  if (packages.has(moduleName)) return stub(packages.get(moduleName));
  const screen = screens.get(origin);
  if (
    screen &&
    (moduleName === 'react-native' || moduleName === `react-native-web/dist/exports/${screen.name}`)
  ) {
    return stub(screen.file);
  }
  if (resolution.type === 'sourceFile' && files.has(resolution.filePath)) {
    return stub(files.get(resolution.filePath));
  }
  return resolution;
}

module.exports = { redirect };
