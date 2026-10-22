import { router, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { HenryMark } from '@/features/brand';
import { EyeIcon, FaceIdIcon, ShieldIcon } from '@/features/icons';
import { Button, Card, Label, Screen, useColors, useThemed, type Palette } from '@/features/ui';

export default function Welcome() {
  const styles = useThemed(makeStyles);
  return (
    <Screen
      footer={
        <>
          <Button title="새 지갑 만들기" onPress={() => router.push('/create')} />
          <Button title="복구 문구로 가져오기" secondary onPress={() => router.push('/import')} />
        </>
      }
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.hero}>
        <HenryMark size={96} />
        <Label bold size={30}>
          Henry Wallet
        </Label>
        <Label muted style={styles.tagline}>
          스테이블코인을 내 손으로 보관하고 보내는 지갑
        </Label>
      </View>

      <Card style={{ gap: 18 }}>
        <Feature
          icon={<ShieldIcon size={22} />}
          title="키는 이 기기에만"
          body="복구 문구(12단어)는 기기 보안 저장소에만 남고 서버로 나가지 않습니다."
        />
        <Feature
          icon={<FaceIdIcon size={22} />}
          title="서명할 때마다 Face ID"
          body="보낼 때마다 잠금을 풀어야 서명됩니다."
        />
        <Feature
          icon={<EyeIcon size={22} />}
          title="보내기 전에 모두 확인"
          body="주소·금액·수수료와 검증 결과를 서명 전에 한 화면에서 보여줍니다."
        />
      </Card>
    </Screen>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  const c = useColors();
  const styles = useThemed(makeStyles);
  return (
    <View style={styles.feature}>
      <View style={[styles.featureIcon, { backgroundColor: c.accentSoft }]}>{icon}</View>
      <View style={{ flex: 1, gap: 2 }}>
        <Label bold>{title}</Label>
        <Label muted size={13} style={{ lineHeight: 19 }}>
          {body}
        </Label>
      </View>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    hero: { alignItems: 'center', gap: 10, paddingTop: 36, paddingBottom: 16 },
    tagline: { textAlign: 'center', lineHeight: 22, maxWidth: 280 },
    feature: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
    featureIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
