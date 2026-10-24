import { useEffect, useState, type PropsWithChildren } from 'react';
import { Animated, Text, View } from 'react-native';

import { FaceIdIcon } from '@/features/icons';
import { useColors } from '@/features/ui';

import { useDemoOverlay } from './notice';
import { useDemoText } from './text';

/**
 * 앱 화면 위에 늘 보이는 데모 안내 줄을 두고, 가짜 파일이 띄우는 안내(토스트)와 Face ID 장면을 그린다.
 * 폰 틀이 있든 없든(좁은 화면) 같은 모양이다.
 */
export function DemoLayer({ children }: PropsWithChildren) {
  const c = useColors();
  const d = useDemoText();
  return (
    <View style={{ flex: 1 }}>
      <View
        accessibilityRole="text"
        style={{
          paddingHorizontal: 16,
          paddingVertical: 7,
          backgroundColor: c.segment,
          borderBottomWidth: 1,
          borderBottomColor: c.border,
        }}
      >
        <Text style={{ fontSize: 12, lineHeight: 17, color: c.muted, textAlign: 'center' }}>
          <Text style={{ fontWeight: '700', color: c.text }}>{d.bannerLead}</Text> {d.bannerBody}
        </Text>
      </View>
      {/* 화면 조각(route chunk)을 받는 동안에도 흰 바탕이 비치지 않게 앱 바탕색을 깐다 */}
      <View style={{ flex: 1, backgroundColor: c.bg }}>{children}</View>
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
      style={{ position: 'absolute', left: 16, right: 16, top: 116, alignItems: 'center' }}
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
