// 데모 모드(STABLE_WALLET_DEMO=1)에서 Metro가 실제 파일 대신 demo/ 의 가짜 파일을 쓰게 한다.
// 바꾸는 곳은 앱 바깥과 닿는 경계뿐이다: 저장소(SQLite), 키 보관(secure-store), RPC 연결, 웹에 없는 스크린샷 차단 API·safe area,
// 그리고 공개 웹 데모에서 막아야 하는 것(진짜 복구 문구 생성·입력, 카메라, 클립보드, 주소 QR·공유, 가짜 거래의 탐색기 링크).
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'src') + path.sep;
const stub = (name) => ({ type: 'sourceFile', filePath: path.resolve(__dirname, name) });
const swap = (real, fake) => [path.resolve(root, real), fake];

/** 앱 파일 → 가짜 파일 */
const files = new Map([
  swap('src/platform/ui.ts', 'platform/ui.tsx'),
  swap('src/core/db.ts', 'stubs/db.ts'),
  swap('src/core/history.ts', 'stubs/history.ts'),
  swap('src/core/keys/vault.ts', 'stubs/vault.ts'),
  swap('src/core/keys/mnemonic.ts', 'stubs/mnemonic.ts'),
  swap('src/core/evm/provider.ts', 'stubs/provider.ts'),
  swap('src/features/format.ts', 'stubs/format.ts'),
  swap('src/features/share.ts', 'stubs/share.ts'),
]);

/** 앱 코드가 부르는 패키지 → 가짜 파일 */
const packages = new Map([['expo-clipboard', 'stubs/clipboard.ts']]);

const entry = path.resolve(__dirname, 'entry.tsx');

// 목록의 앱 파일·패키지·가짜 파일이 없으면(옮기거나 이름을 바꾸면) 바꿔 끼우기가 조용히 꺼져
// 공개 데모에서 진짜 모듈(무작위 복구 문구, 카메라 등)이 돈다. 그러지 않게 Metro를 띄울 때 바로 멈춘다.
const missing = [
  ...[...files].flatMap(([real, fake]) => [real, stub(fake).filePath]),
  ...[...packages].flatMap(([name, fake]) => [
    path.join(root, 'node_modules', name),
    stub(fake).filePath,
  ]),
  entry,
].filter((p) => !fs.existsSync(p));
if (missing.length > 0) {
  const list = missing.map((p) => `  ${path.relative(root, p)}`).join('\n');
  throw new Error(
    `demo/overrides.js: 바꿔 끼울 대상이 없다. 옮겼거나 이름을 바꿨으면 목록을 고친다:\n${list}`,
  );
}

/**
 * 기본 해석 결과를 받아 데모용 파일로 바꿔 돌려준다. origin은 import하는 파일이다.
 * Metro는 해석 결과를 같은 폴더끼리 나눠 쓰므로 "어느 화면에서 부를 때만" 같은 조건은 옆 화면으로 샌다.
 * 화면 하나의 부품만 바꾸려면 그 부품을 src의 작은 파일로 빼고 파일째 바꾼다(phrase-input, share).
 */
function redirect(moduleName, resolution, origin) {
  if (moduleName === 'expo-router/entry') return { type: 'sourceFile', filePath: entry };
  // 가짜 파일은 진짜를 감싸 쓰므로, 앱 코드(src)에서 부를 때만 바꾼다
  if (!origin || !origin.startsWith(src)) return resolution;
  if (packages.has(moduleName)) return stub(packages.get(moduleName));
  if (resolution.type === 'sourceFile' && files.has(resolution.filePath)) {
    return stub(files.get(resolution.filePath));
  }
  return resolution;
}

module.exports = { redirect };
