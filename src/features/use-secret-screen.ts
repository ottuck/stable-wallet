import {
  disableAppSwitcherProtectionAsync,
  enableAppSwitcherProtectionAsync,
  usePreventScreenCapture,
  useScreenshotListener,
} from 'expo-screen-capture';
import { useEffect } from 'react';

/**
 * 복구 문구가 보이는 화면: 캡처를 막고, 앱 전환기 미리보기를 흐리게 한다.
 * 차단이 뚫려 스크린샷이 찍히면 onScreenshot을 부른다(문구가 사진 앱에 남았다고 본다).
 */
export function useSecretScreen(onScreenshot: () => void) {
  usePreventScreenCapture('secret');
  useScreenshotListener(onScreenshot);

  useEffect(() => {
    void enableAppSwitcherProtectionAsync(1);
    return () => {
      void disableAppSwitcherProtectionAsync();
    };
  }, []);
}
