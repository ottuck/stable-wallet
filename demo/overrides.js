// 데모 모드(STABLE_WALLET_DEMO=1)에서 Metro가 실제 파일 대신 demo/ 의 가짜 파일을 쓰게 한다.
// 바꾸는 곳은 앱 바깥과 닿는 경계뿐이다: 저장소(SQLite), 키 보관(secure-store), RPC 연결.
const path = require('path');

const root = path.resolve(__dirname, '..');
const swap = (real, fake) => [path.resolve(root, real), path.resolve(__dirname, fake)];

const files = new Map([
  swap('src/core/db.ts', 'stubs/db.ts'),
  swap('src/core/history.ts', 'stubs/history.ts'),
  swap('src/core/keys/vault.ts', 'stubs/vault.ts'),
  swap('src/core/evm/provider.ts', 'stubs/provider.ts'),
]);

const entry = path.resolve(__dirname, 'entry.tsx');

/** 기본 해석 결과를 받아 데모용 파일로 바꿔 돌려준다. */
function redirect(moduleName, resolution) {
  if (moduleName === 'expo-router/entry') return { type: 'sourceFile', filePath: entry };
  if (resolution.type === 'sourceFile' && files.has(resolution.filePath)) {
    return { type: 'sourceFile', filePath: files.get(resolution.filePath) };
  }
  return resolution;
}

module.exports = { redirect };
