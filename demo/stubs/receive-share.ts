import { showNotice } from '../notice';

// 받기 화면(src/app/receive.tsx)이 부르는 react-native. 공유만 막고 나머지는 그대로다.
// 데모 주소를 남에게 보내면 그 주소로 실제 돈이 올 수 있어서다.
export * from 'react-native';

export const Share = {
  async share() {
    showNotice('notShared');
    return { action: 'dismissedAction' as const };
  },
};

export default Share;
