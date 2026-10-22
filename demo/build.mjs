// pnpm demo:build — 웹 데모를 정적 파일(dist/)로 만든다. 공개 사이트(wallet.portfolio-hub.dev) 배포용.
import { spawn } from 'node:child_process';

const child = spawn(
  'pnpm',
  ['exec', 'expo', 'export', '--platform', 'web', '--output-dir', 'dist', '--clear'],
  {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    // EXPO_PUBLIC_DEMO_PUBLIC: 공개 사이트는 ?state=를 무시하고 홈에서 시작한다(demo/mode.ts)
    env: { ...process.env, STABLE_WALLET_DEMO: '1', EXPO_PUBLIC_DEMO_PUBLIC: '1' },
  },
);
child.on('exit', (code) => process.exit(code ?? 0));
