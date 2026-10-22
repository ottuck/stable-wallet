// pnpm demo:build — 웹 데모를 정적 파일(dist/)로 만든다. 공개 사이트(wallet.portfolio-hub.dev) 배포용.
import { spawn } from 'node:child_process';
import { readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';

const child = spawn(
  'pnpm',
  ['exec', 'expo', 'export', '--platform', 'web', '--output-dir', DIST, '--clear'],
  {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    // EXPO_PUBLIC_DEMO_PUBLIC: 공개 사이트는 ?state=를 무시하고 홈에서 시작한다(demo/mode.ts)
    env: { ...process.env, STABLE_WALLET_DEMO: '1', EXPO_PUBLIC_DEMO_PUBLIC: '1' },
  },
);
child.on('exit', (code) => {
  if (code === 0) moveVendorAssets();
  process.exit(code ?? 0);
});

/**
 * Cloudflare Pages는 경로에 node_modules가 들어간 파일을 올리지 않는다. 패키지의 폰트·아이콘이
 * dist/assets/node_modules/.pnpm/… 에 있으면 빠지므로, 그 경로를 vendor/pnpm으로 바꾸고 번들 안의 경로도 고친다.
 */
function moveVendorAssets() {
  const rename = (p) => p.replaceAll('node_modules', 'vendor').replaceAll('.pnpm', 'pnpm');
  const from = join(DIST, 'assets', 'node_modules');
  try {
    statSync(from);
  } catch {
    return;
  }
  renameSync(from, join(DIST, 'assets', 'vendor'));
  for (const dir of walk(join(DIST, 'assets', 'vendor'), true).reverse()) {
    const name = dir.split(/[\\/]/).pop();
    if (name === 'node_modules' || name === '.pnpm') renameSync(dir, join(dir, '..', rename(name)));
  }
  const pattern = /assets\/node_modules\/[^"'`\s)]*/g;
  for (const file of walk(DIST, false)) {
    if (!/\.(js|html|json|css)$/.test(file)) continue;
    const text = readFileSync(file, 'utf8');
    const next = text.replace(pattern, rename);
    if (next !== text) writeFileSync(file, next);
  }
}

/** 하위 경로 목록. dirs면 디렉터리만, 아니면 파일만(부모가 앞에 온다) */
function walk(root, dirs) {
  const out = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      if (dirs) out.push(path);
      out.push(...walk(path, dirs));
    } else if (!dirs) {
      out.push(path);
    }
  }
  return out;
}
