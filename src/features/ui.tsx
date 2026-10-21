import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  type TextProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LIGHT = { text: '#111', muted: '#666', bg: '#fff', card: '#f2f2f5', accent: '#208AEF' };
const DARK = { text: '#f5f5f5', muted: '#9a9a9a', bg: '#000', card: '#1c1c1e', accent: '#4aa3ff' };

export function useColors() {
  return useColorScheme() === 'dark' ? DARK : LIGHT;
}

export function Screen({ children }: { children: ReactNode }) {
  const c = useColors();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.screen}>{children}</ScrollView>
    </SafeAreaView>
  );
}

export function Label({
  muted,
  mono,
  style,
  ...props
}: TextProps & { muted?: boolean; mono?: boolean }) {
  const c = useColors();
  return (
    <Text
      selectable={mono}
      style={[{ color: muted ? c.muted : c.text, fontSize: 16 }, mono && styles.mono, style]}
      {...props}
    />
  );
}

export function Button({
  title,
  onPress,
  busy,
  secondary,
}: {
  title: string;
  onPress: () => void;
  busy?: boolean;
  secondary?: boolean;
}) {
  const c = useColors();
  return (
    <Pressable
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: secondary ? c.card : c.accent, opacity: pressed || busy ? 0.6 : 1 },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={secondary ? c.text : '#fff'} />
      ) : (
        <Text style={{ color: secondary ? c.text : '#fff', fontSize: 16, fontWeight: '600' }}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function Card({ children }: { children: ReactNode }) {
  const c = useColors();
  return <View style={[styles.card, { backgroundColor: c.card }]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { padding: 20, gap: 16 },
  mono: { fontFamily: 'Menlo', fontSize: 14 },
  button: { height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 12, padding: 16, gap: 8 },
});
