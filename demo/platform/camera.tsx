import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { DEMO } from '../data';

// expo-camera의 CameraView·useCameraPermissions 대신(demo/platform/ui.tsx가 내보낸다).
// 공개 데모가 방문자에게 카메라 권한을 묻지 않도록 카메라는 켜지 않는다.
// 어두운 뷰파인더에 예시 QR이 비친 것처럼 보여주고, 잠깐 뒤 예시 받는 주소를 읽은 것처럼 넘긴다.
// 화면의 QR에는 주소가 아니라 안내 글이 담겨 있어 다른 기기로 찍어도 송금 주소가 되지 않는다.

export type BarcodeScanningResult = { type: string; data: string };

/** 뷰파인더가 열린 뒤 QR을 "인식"하기까지 */
const RECOGNIZE_MS = 1800;

const granted = { granted: true, canAskAgain: true, status: 'granted', expires: 'never' };

export function useCameraPermissions() {
  return [granted, async () => granted, async () => granted] as const;
}

export function CameraView({
  style,
  onBarcodeScanned,
}: {
  style?: StyleProp<ViewStyle>;
  onBarcodeScanned?: (result: BarcodeScanningResult) => void;
}) {
  const [line] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(line, {
        toValue: 1,
        duration: 1400,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }),
    );
    loop.start();
    const timer = setTimeout(
      () => onBarcodeScanned?.({ type: 'qr', data: DEMO.recipient }),
      RECOGNIZE_MS,
    );
    return () => {
      loop.stop();
      clearTimeout(timer);
    };
    // 처음 열 때 한 번만 인식한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line]);

  return (
    <View style={[style, styles.root]}>
      <View style={styles.glow} />
      <View style={styles.paper}>
        <QRCode value={DEMO.qrText} size={150} color="#1A1D24" backgroundColor="#F4F1EA" />
      </View>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.line,
          {
            transform: [
              { translateY: line.interpolate({ inputRange: [0, 1], outputRange: [-110, 110] }) },
            ],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: '#0B0D12', alignItems: 'center', justifyContent: 'center' },
  glow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#1B2748',
    opacity: 0.5,
  },
  // 카메라에 비친 종이처럼 살짝 기울이고 어둡게
  paper: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#F4F1EA',
    opacity: 0.88,
    transform: [{ rotate: '-4deg' }],
  },
  line: {
    position: 'absolute',
    width: 220,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#7C9DFF',
    boxShadow: '0 0 12px #7C9DFF',
  },
});
