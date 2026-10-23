import { useContext, useEffect, type ComponentProps } from 'react';
import { Text, View, type TextInputProps } from 'react-native';
import RealQRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets as useRealInsets } from 'react-native-safe-area-context';

import { fonts, useColors } from '@/features/theme';
import type * as Real from '@/platform/ui';

import { DEMO } from '../data';
import { FrameInsets } from '../frame-insets';
import { useDemoText } from '../text';

// src/platform/ui.ts 대신. 공개 웹 데모가 실제 돈과 닿지 않게, 웹에 없는 기능은 흉내 낸다.
export { CameraView, useCameraPermissions, type BarcodeScanningResult } from './camera';

/** QR 모양은 그대로 두되 주소 대신 안내 글을 담는다. 누가 실제 지갑으로 찍어도 송금 주소가 되지 않는다. */
export function QRCode(props: ComponentProps<typeof RealQRCode>) {
  return <RealQRCode {...props} value={DEMO.qrText} />;
}

/** 웹에는 safe area가 없어 휴대폰 틀 안에서는 iPhone과 같은 값을 준다. 틀 밖(휴대폰 브라우저)은 실제 값. */
export const useSafeAreaInsets: typeof Real.useSafeAreaInsets = () => {
  const frame = useContext(FrameInsets);
  const real = useRealInsets();
  return frame ?? real;
};

/** 웹에는 스크린샷 차단 API가 없다 */
export const useSecretScreen: typeof Real.useSecretScreen = () => {};

/**
 * 복구 문구 입력란 대신. 공개 사이트에 복구 문구 입력란이 있으면 방문자가 진짜 문구를 넣을 수 있고
 * 피싱으로 분류될 수 있어서, 입력은 받지 않고 예시 문구를 보여준 뒤 그 문구로 가져온다.
 */
export function PhraseInput({ onChangeText, style }: TextInputProps) {
  const c = useColors();
  const d = useDemoText();

  useEffect(() => {
    onChangeText?.(DEMO.phrase);
    // 처음 한 번만 채운다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ gap: 10 }}>
      <View style={[style, { backgroundColor: c.card, borderRadius: 12, padding: 12 }]}>
        <Text style={{ fontFamily: fonts.mono, fontSize: 15, lineHeight: 24, color: c.muted }}>
          {DEMO.phrase}
        </Text>
      </View>
      <Text style={{ fontSize: 13, lineHeight: 20, color: c.warn, fontWeight: '600' }}>
        {d.importNote}
      </Text>
    </View>
  );
}
