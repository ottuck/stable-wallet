import { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ScanIcon } from '@/features/icons';

import { DEMO } from '../data';
import { useDemoText } from '../text';

// expo-camera 대신. 공개 데모가 방문자에게 카메라 권한을 묻지 않도록 카메라는 켜지 않는다.
// 어두운 가짜 뷰파인더와 "예시 QR 읽기" 버튼을 보여주고, 누르면 예시 받는 주소를 읽은 것처럼 넘긴다.

export type BarcodeScanningResult = { type: string; data: string };

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
  const d = useDemoText();
  const [line] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(line, {
        toValue: 1,
        duration: 1800,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [line]);

  return (
    <View style={[style, styles.root]}>
      <View style={styles.glow} />
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
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onBarcodeScanned?.({ type: 'qr', data: DEMO.recipient })}
          style={({ pressed }) => [styles.sample, pressed && { opacity: 0.7 }]}
        >
          <ScanIcon size={18} color="#0F1115" />
          <Text style={styles.sampleText}>{d.scanSample}</Text>
        </Pressable>
        <Text style={styles.note}>{d.scanNote}</Text>
      </View>
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
  line: {
    position: 'absolute',
    width: 220,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#7C9DFF',
    boxShadow: '0 0 12px #7C9DFF',
  },
  actions: { position: 'absolute', bottom: 150, alignItems: 'center', gap: 10 },
  sample: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  sampleText: { color: '#0F1115', fontSize: 15, fontWeight: '700' },
  note: { color: '#9AA1AD', fontSize: 12 },
});
