import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useT } from '@/features/i18n';
import { CheckIcon } from '@/features/icons';
import { Label, useColors, useThemed, type Palette } from '@/features/ui';

/**
 * 버튼 바로 아래에 펼쳐지는 목록(웹·Android). 버튼과 같은 View 안에 두고, 바깥을 누르면 닫는다.
 * 목록이 다음 카드 위로 겹쳐 보이도록 부모 줄에 zIndex를 준다(MENU_LAYER).
 */
export function Dropdown({
  open,
  onClose,
  align = 'left',
  children,
}: PropsWithChildren<{ open: boolean; onClose: () => void; align?: 'left' | 'right' }>) {
  const t = useT();
  const styles = useThemed(makeStyles);
  if (!open) return null;
  return (
    <>
      <Pressable accessibilityLabel={t.common.cancel} onPress={onClose} style={styles.backdrop} />
      <View
        accessibilityRole="menu"
        style={[styles.menu, align === 'left' ? { left: 0 } : { right: 0 }]}
      >
        {children}
      </View>
    </>
  );
}

/** 목록 한 줄. 고른 줄은 굵게, 오른쪽에 체크 */
export function DropdownItem({
  label,
  selected,
  onPress,
  left,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  left?: ReactNode;
}) {
  const c = useColors();
  const styles = useThemed(makeStyles);
  return (
    <Pressable
      accessibilityRole="menuitem"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && { backgroundColor: c.soft }]}
    >
      {left}
      <Label bold={selected} style={{ flex: 1 }}>
        {label}
      </Label>
      {selected && <CheckIcon size={16} color={c.accent} strokeWidth={2.4} />}
    </Pressable>
  );
}

/** 목록을 펼친 줄이 아래 카드보다 위에 그려지게 하는 zIndex */
export const MENU_LAYER = { zIndex: 10 };

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    backdrop: { position: 'absolute', top: -1000, left: -1000, width: 3000, height: 3000 },
    menu: {
      position: 'absolute',
      top: 50,
      minWidth: 200,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      boxShadow: '0 10px 30px rgba(15,17,21,0.14)',
    },
    item: {
      minHeight: 44,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
  });
