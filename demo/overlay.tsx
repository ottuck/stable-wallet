import { useEffect, useState, type PropsWithChildren } from 'react';
import { Animated, Text, View } from 'react-native';

import { FaceIdIcon } from '@/features/icons';

import { useDemoOverlay } from './notice';
import { useDemoText } from './text';

/**
 * 앱 화면 위에 늘 보이는 DEMO 띠를 두고, 가짜 파일이 띄우는 안내(토스트)와 Face ID 장면을 그린다.
 * 폰 틀이 있든 없든(좁은 화면) 같은 모양이다.
 */
export function DemoLayer({ children }: PropsWithChildren) {
  const d = useDemoText();
  return (
    <View style={{ flex: 1 }}>
      <View
        accessibilityRole="text"
        style={{
          height: 24,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FFE9A0',
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '800', color: '#5C2E00', letterSpacing: 0.3 }}>
          {d.banner}
        </Text>
      </View>
      <View style={{ flex: 1 }}>{children}</View>
      <FaceIdScene />
      <Toast />
    </View>
  );
}

function Toast() {
  const d = useDemoText();
  const notice = useDemoOverlay((s) => s.notice);
  const [shown, setShown] = useState<typeof notice>(null);

  useEffect(() => {
    if (!notice) return;
    setShown(notice);
    const timer = setTimeout(() => setShown(null), 2200);
    return () => clearTimeout(timer);
  }, [notice]);

  if (!shown) return null;
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: 16, right: 16, top: 84, alignItems: 'center' }}
    >
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 14,
          backgroundColor: 'rgba(15,17,21,0.92)',
        }}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', textAlign: 'center' }}>
          {d[shown.key]}
        </Text>
      </View>
    </View>
  );
}

function FaceIdScene() {
  const on = useDemoOverlay((s) => s.faceId);
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!on) return;
    pulse.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 450, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 450, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [on, pulse]);

  if (!on) return null;
  return (
    <View
      pointerEvents="auto"
      style={{
        position: 'absolute',
        inset: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.25)',
      }}
    >
      <View
        style={{
          width: 150,
          height: 150,
          borderRadius: 32,
          backgroundColor: 'rgba(28,28,30,0.92)',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        <Animated.View
          style={{
            transform: [
              { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) },
            ],
          }}
        >
          <FaceIdIcon size={64} color="#FFFFFF" strokeWidth={1.6} />
        </Animated.View>
        <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Face ID</Text>
      </View>
    </View>
  );
}
