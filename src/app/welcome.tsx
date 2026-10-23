import { router, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { HenryMark } from '@/features/brand';
import { MENU_LAYER } from '@/features/dropdown';
import { useT } from '@/features/i18n';
import { LanguageSwitch } from '@/features/i18n/language-switch';
import { EyeIcon, FaceIdIcon, ShieldIcon } from '@/features/icons';
import { Button, Card, Label, Screen, useColors, useThemed, type Palette } from '@/features/ui';

export default function Welcome() {
  const t = useT();
  const styles = useThemed(makeStyles);
  return (
    <Screen
      footer={
        <>
          <Button title={t.welcome.create} onPress={() => router.push('/create')} />
          <Button title={t.welcome.import} secondary onPress={() => router.push('/import')} />
        </>
      }
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.top, MENU_LAYER]}>
        <LanguageSwitch />
      </View>

      <View style={styles.hero}>
        <HenryMark size={96} />
        <Label bold size={30}>
          Henry Wallet
        </Label>
        <Label muted style={styles.tagline}>
          {t.welcome.tagline}
        </Label>
      </View>

      <Card style={{ gap: 18 }}>
        <Feature
          icon={<ShieldIcon size={22} />}
          title={t.welcome.keysTitle}
          body={t.welcome.keysBody}
        />
        <Feature
          icon={<FaceIdIcon size={22} />}
          title={t.welcome.faceIdTitle}
          body={t.welcome.faceIdBody}
        />
        <Feature
          icon={<EyeIcon size={22} />}
          title={t.welcome.checkTitle}
          body={t.welcome.checkBody}
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
    top: { alignItems: 'flex-end' },
    hero: { alignItems: 'center', gap: 10, paddingTop: 20, paddingBottom: 16 },
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
