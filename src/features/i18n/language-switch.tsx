import { useState } from 'react';
import { ActionSheetIOS, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Dropdown, DropdownItem } from '@/features/dropdown';
import { GlobeIcon } from '@/features/icons';
import { useColors, useThemed, type Palette } from '@/features/ui';

import { useLanguage, useLocale, useT, type Locale } from './index';

const LOCALES: Locale[] = ['ko', 'en'];

/**
 * 화면 맨 위 오른쪽의 동그란 언어 버튼(지구 아이콘만, 지금 언어는 화면 글자로 안다). 네트워크 버튼처럼 iOS는 액션 시트,
 * 그 밖은 버튼 아래에 펼쳐지는 목록으로 고른다. 고른 값은 기기에 저장된다.
 */
export function LanguageSwitch() {
  const c = useColors();
  const t = useT();
  const styles = useThemed(makeStyles);
  const locale = useLocale();
  const setPref = useLanguage((s) => s.setPref);
  const [open, setOpen] = useState(false);

  function press() {
    if (Platform.OS !== 'ios') {
      setOpen((o) => !o);
      return;
    }
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [...LOCALES.map((l) => t.common.languageName[l]), t.common.cancel],
        cancelButtonIndex: LOCALES.length,
      },
      (i) => i < LOCALES.length && setPref(LOCALES[i]),
    );
  }

  return (
    // 펼친 쪽이 옆 버튼보다 위에 오게 해서 바깥 누르기가 옆 버튼에도 먹게 한다
    <View style={open && { zIndex: 1 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t.common.language}: ${t.common.languageName[locale]}`}
        accessibilityState={{ expanded: open }}
        onPress={press}
        style={styles.button}
      >
        <GlobeIcon size={20} color={c.text} />
      </Pressable>

      <Dropdown open={open} onClose={() => setOpen(false)} align="right">
        {LOCALES.map((l) => (
          <DropdownItem
            key={l}
            label={t.common.languageName[l]}
            selected={l === locale}
            onPress={() => {
              setPref(l);
              setOpen(false);
            }}
          />
        ))}
      </Dropdown>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    button: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.segment,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
