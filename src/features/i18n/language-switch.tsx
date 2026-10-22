import { Pressable, StyleSheet, View } from 'react-native';

import { Label, useColors, useThemed, type Palette } from '@/features/ui';

import { useLanguage, useLocale, useT, type Locale } from './index';

const OPTIONS: { value: Locale; label: string }[] = [
  { value: 'ko', label: 'KO' },
  { value: 'en', label: 'EN' },
];

/** 화면 맨 위의 작은 언어 선택(KO · EN). 고른 값은 기기에 저장된다. */
export function LanguageSwitch() {
  const c = useColors();
  const t = useT();
  const styles = useThemed(makeStyles);
  const locale = useLocale();
  const setPref = useLanguage((s) => s.setPref);
  return (
    <View style={styles.segment} accessibilityRole="tablist" accessibilityLabel={t.common.language}>
      {OPTIONS.map((o) => (
        <Pressable
          key={o.value}
          accessibilityRole="tab"
          accessibilityState={{ selected: locale === o.value }}
          hitSlop={{ top: 8, bottom: 8 }}
          onPress={() => setPref(o.value)}
          style={[styles.item, locale === o.value && styles.selected]}
        >
          <Label bold size={12} color={locale === o.value ? c.text : c.muted}>
            {o.label}
          </Label>
        </Pressable>
      ))}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    segment: { flexDirection: 'row', backgroundColor: c.segment, borderRadius: 14, padding: 3 },
    item: {
      minWidth: 40,
      minHeight: 32,
      borderRadius: 11,
      paddingHorizontal: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selected: { backgroundColor: c.card },
  });
