import { Pressable, StyleSheet, View } from 'react-native';

import { Label, useColors, useThemed, type Palette } from '@/features/ui';

import { useLanguage, useT, type LanguagePref } from './index';

/** 자동 · 한국어 · English 중 고른다. 고른 값은 기기에 저장된다. */
export function LanguagePicker() {
  const c = useColors();
  const t = useT();
  const styles = useThemed(makeStyles);
  const pref = useLanguage((s) => s.pref);
  const setPref = useLanguage((s) => s.setPref);
  const options: { value: LanguagePref; label: string }[] = [
    { value: 'auto', label: t.common.languageAuto },
    { value: 'ko', label: '한국어' },
    { value: 'en', label: 'English' },
  ];
  return (
    <View style={styles.segment} accessibilityRole="tablist" accessibilityLabel={t.common.language}>
      {options.map((o) => (
        <Pressable
          key={o.value}
          accessibilityRole="tab"
          accessibilityState={{ selected: pref === o.value }}
          onPress={() => setPref(o.value)}
          style={[styles.item, pref === o.value && styles.selected]}
        >
          <Label bold size={13} color={pref === o.value ? c.text : c.muted}>
            {o.label}
          </Label>
        </Pressable>
      ))}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    segment: { flexDirection: 'row', backgroundColor: c.segment, borderRadius: 12, padding: 4 },
    item: {
      flex: 1,
      minHeight: 40,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selected: { backgroundColor: c.card },
  });
