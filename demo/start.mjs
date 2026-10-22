// pnpm demo — 가짜 데이터로 웹에서 앱을 연다(휴대폰 틀 안에서). 추가 인자는 expo start로 넘어간다.
import { spawn } from 'node:child_process';

const child = spawn('pnpm', ['exec', 'expo', 'start', '--web', ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, STABLE_WALLET_DEMO: '1' },
});
child.on('exit', (code) => process.exit(code ?? 0));
