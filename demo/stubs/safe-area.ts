import { useContext } from 'react';
import { useSafeAreaInsets as useRealInsets } from 'react-native-safe-area-context';

import { FrameInsets } from '../frame-insets';

// react-native-safe-area-context 대신(앱 코드에서 부를 때). 웹에는 safe area가 없어서 휴대폰 틀 안에서는
// iPhone과 같은 값을 준다. 틀은 expo-router의 SafeAreaProvider 바깥이라 Provider로 감싸서는 화면에 닿지 않는다.
export * from 'react-native-safe-area-context';

export function useSafeAreaInsets() {
  const frame = useContext(FrameInsets);
  const real = useRealInsets();
  return frame ?? real;
}
