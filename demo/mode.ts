/**
 * 주소창의 ?state= 로 시작 상태를 고른다(전시에서 첫 화면을 바꿔 보여줄 때).
 * ready(기본) 지갑 있음 · empty 지갑 없음(환영 화면) · found 재설치 후 기존 지갑 발견 · error 보안 저장소 읽기 실패
 */
export type DemoMode = 'ready' | 'empty' | 'found' | 'error';

function read(): DemoMode {
  // 공개 사이트(pnpm demo:build)는 늘 지갑이 있는 홈에서 시작한다. 지갑 만들기·가져오기는 보여주지 않는다
  if (process.env.EXPO_PUBLIC_DEMO_PUBLIC === '1') return 'ready';
  const search = (globalThis as { location?: { search?: string } }).location?.search ?? '';
  const state = new URLSearchParams(search).get('state');
  return state === 'empty' || state === 'found' || state === 'error' ? state : 'ready';
}

export const mode: DemoMode = read();
