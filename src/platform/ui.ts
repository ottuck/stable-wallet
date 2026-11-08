// 앱이 기기와 닿는 화면 쪽 경계: 카메라, QR 그리기, 복구 문구 입력란, 앱 전환기 가림, safe area.
// app·features는 이 기능들을 여기서만 꺼내 쓴다(eslint가 직접 import를 막는다).
// 웹 데모는 이 파일을 demo/platform/ui.tsx로 통째로 바꾼다(demo/overrides.js).
import {
  disableAppSwitcherProtectionAsync,
  enableAppSwitcherProtectionAsync,
} from 'expo-screen-capture';
import { useEffect } from 'react';

export { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
export { default as QRCode } from 'react-native-qrcode-svg';
export { useSafeAreaInsets } from 'react-native-safe-area-context';
/** 복구 문구 입력란(가져오기 화면). 데모는 입력을 받지 않는 가짜로 바꾼다. */
export { TextInput as PhraseInput } from 'react-native';

/**
 * 복구 문구가 보이는 화면: 앱 전환기 미리보기를 흐리게 한다.
 * 스크린샷·화면 녹화는 막지 않는다(사용자가 보관할 수 있다). 사진 앱에 남는다는 경고만 화면에 둔다.
 */
export function useSecretScreen() {
  useEffect(() => {
    void enableAppSwitcherProtectionAsync(1);
    return () => {
      void disableAppSwitcherProtectionAsync();
    };
  }, []);
}
