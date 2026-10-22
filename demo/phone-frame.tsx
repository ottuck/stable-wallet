import type { PropsWithChildren } from 'react';
import { Platform, Text, useColorScheme, useWindowDimensions, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { useColors } from '@/features/ui';

import { DemoLayer } from './overlay';

const W = 390;
const H = 844;
const BEZEL = 12;
const STATUS = 47;
const CAPTION = 40;

/** 웹 데모 전용: 넓은 화면에서는 가운데에 iPhone 모양 틀을 놓고 앱을 그 안에 그린다. */
export function PhoneFrame({ children }: PropsWithChildren) {
  const c = useColors();
  const dark = useColorScheme() === 'dark';
  const win = useWindowDimensions();
  if (Platform.OS !== 'web' || win.width < 520) return <DemoLayer>{children}</DemoLayer>;

  const scale = Math.min(1, (win.height - CAPTION * 2) / (H + BEZEL * 2));
  const ink = dark ? '#FFFFFF' : '#0F1115';
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: dark ? '#0A0B0F' : '#E8E4DD',
      }}
    >
      <View
        style={{
          width: W + BEZEL * 2,
          height: H + BEZEL * 2,
          borderRadius: 64,
          backgroundColor: '#15171C',
          padding: BEZEL,
          transform: [{ scale }],
          boxShadow: dark
            ? '0 30px 80px rgba(0,0,0,0.6), inset 0 0 0 2px #2A2D35'
            : '0 30px 70px rgba(60,50,30,0.28), inset 0 0 0 2px #2A2D35',
        }}
      >
        <View
          style={{
            flex: 1,
            borderRadius: 52,
            overflow: 'hidden',
            backgroundColor: c.bg,
            paddingTop: STATUS,
          }}
        >
          {/* 웹에는 safe area가 없어 틀의 홈 인디케이터만큼 아래를 비운다 */}
          <SafeAreaInsetsContext.Provider value={{ top: 0, bottom: 24, left: 0, right: 0 }}>
            <DemoLayer>{children}</DemoLayer>
          </SafeAreaInsetsContext.Provider>

          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: STATUS,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 34,
              paddingTop: 6,
            }}
          >
            <Text style={{ color: ink, fontSize: 16, fontWeight: '700' }}>9:41</Text>
            <Text style={{ color: ink, fontSize: 13, fontWeight: '700' }}>5G ▂▄▆ ▮</Text>
          </View>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 11,
              alignSelf: 'center',
              width: 120,
              height: 34,
              borderRadius: 17,
              backgroundColor: '#000000',
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              bottom: 8,
              alignSelf: 'center',
              width: 134,
              height: 5,
              borderRadius: 3,
              backgroundColor: ink,
              opacity: 0.85,
            }}
          />
        </View>
      </View>

      <Text
        style={{
          position: 'absolute',
          bottom: 12,
          color: dark ? '#7C8190' : '#8A8478',
          fontSize: 12,
        }}
      >
        Henry Wallet demo · fake data, no real assets / 가짜 데이터 · 실제 자산 아님
      </Text>
    </View>
  );
}
