// 데모 모드(STABLE_WALLET_DEMO=1)에서 Metro가 실제 파일 대신 demo/ 의 가짜 파일을 쓰게 한다.
// 앱이 기기·바깥과 닿는 곳은 src/platform 두 파일뿐이라(eslint가 다른 곳의 직접 import를 막는다) 그 둘만 바꾼다:
// services(보안 저장소·난수·RPC·저장소·클립보드·공유·링크)와 ui(카메라·QR·복구 문구 입력란·화면 캡처 차단·safe area).
// 지갑 규칙(core)과 화면(app·features)은 실제 코드가 그대로 돈다.
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'src') + path.sep;
const swap = (real, fake) => [path.resolve(root, real), path.resolve(__dirname, fake)];

/** 앱 파일 → 가짜 파일 */
const files = new Map([
  swap('src/platform/services.ts', 'platform/services.ts'),
  swap('src/platform/ui.ts', 'platform/ui.tsx'),
]);

const entry = path.resolve(__dirname, 'entry.tsx');

// 목록의 파일이 없으면(옮기거나 이름을 바꾸면) 바꿔 끼우기가 조용히 꺼져
// 공개 데모에서 진짜 모듈(무작위 복구 문구, 카메라 등)이 돈다. 그러지 않게 Metro를 띄울 때 바로 멈춘다.
const missing = [...[...files].flat(), entry].filter((p) => !fs.existsSync(p));
if (missing.length > 0) {
  const list = missing.map((p) => `  ${path.relative(root, p)}`).join('\n');
  throw new Error(
    `demo/overrides.js: 바꿔 끼울 대상이 없다. 옮겼거나 이름을 바꿨으면 목록을 고친다:\n${list}`,
  );
}

/**
 * 기본 해석 결과를 받아 데모용 파일로 바꿔 돌려준다. origin은 import하는 파일이다.
 * 늘 파일째 바꾼다: Metro는 해석 결과를 같은 폴더끼리 나눠 쓰므로 "어느 화면에서 부를 때만" 같은 조건은 옆 화면으로 샌다.
 */
function redirect(moduleName, resolution, origin) {
  if (moduleName === 'expo-router/entry') return { type: 'sourceFile', filePath: entry };
  if (!origin || !origin.startsWith(src)) return resolution;
  if (resolution.type === 'sourceFile' && files.has(resolution.filePath)) {
    return { type: 'sourceFile', filePath: files.get(resolution.filePath) };
  }
  return resolution;
}

module.exports = { redirect };
