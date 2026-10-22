import type * as Real from '@/features/use-secret-screen';

// 실제 파일(src/features/use-secret-screen.ts)은 iOS·Android의 스크린샷 차단 API를 쓴다.
// 웹에는 그 API가 없어 오류가 나므로, 데모에서는 아무것도 하지 않는다.
export const useSecretScreen: typeof Real.useSecretScreen = () => {};
