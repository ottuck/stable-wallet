import { showNotice } from '../notice';

// src/features/share.ts 대신. 받기 화면의 주소 공유를 막는다.
// 데모 주소를 남에게 보내면 그 주소로 실제 돈이 올 수 있어서다.

export const Share = {
  async share() {
    showNotice('notShared');
    return { action: 'dismissedAction' as const };
  },
};
