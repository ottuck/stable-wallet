import { useState } from 'react';
import { ActionSheetIOS, Platform, Pressable, StyleSheet, View } from 'react-native';

import { activeNetworks } from '@/core/config/networks';
import { useT } from '@/features/i18n';
import { CheckIcon, ChevronDownIcon } from '@/features/icons';
import { useNetwork } from '@/features/network-store';
import { Label, networkColor, useColors, useThemed, type Palette } from '@/features/ui';

/**
 * 홈 왼쪽 위의 네트워크 버튼. iOS는 시스템 액션 시트로, 그 밖(웹·Android)은 버튼 아래에 펼쳐지는 목록으로 고른다.
 * 목록이 다음 카드 위로 겹쳐 보이도록 부모 줄에 zIndex를 준다(MENU_LAYER).
 */
export function NetworkPicker() {
  const c = useColors();
  const t = useT();
  const styles = useThemed(makeStyles);
  const { network, setNetwork } = useNetwork();
  const [open, setOpen] = useState(false);

  function press() {
    if (Platform.OS !== 'ios') {
      setOpen((o) => !o);
      return;
    }
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [...activeNetworks.map((n) => n.name), t.common.cancel],
        cancelButtonIndex: activeNetworks.length,
      },
      (i) => i < activeNetworks.length && setNetwork(activeNetworks[i]),
    );
  }

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.home.networkLabel(network.name)}
        accessibilityState={{ expanded: open }}
        onPress={press}
        style={styles.button}
      >
        <View style={[styles.dot, { backgroundColor: networkColor(network.native.symbol) }]} />
        <Label bold>{network.name}</Label>
        <View style={open && { transform: [{ rotate: '180deg' }] }}>
          <ChevronDownIcon size={14} color={c.muted} />
        </View>
      </Pressable>

      {open && (
        <>
          {/* 바깥을 누르면 닫는다 */}
          <Pressable
            accessibilityLabel={t.common.cancel}
            onPress={() => setOpen(false)}
            style={styles.backdrop}
          />
          <View accessibilityRole="menu" style={styles.menu}>
            {activeNetworks.map((n) => {
              const selected = n.id === network.id;
              return (
                <Pressable
                  key={n.id}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    setNetwork(n);
                    setOpen(false);
                  }}
                  style={({ pressed }) => [styles.item, pressed && { backgroundColor: c.soft }]}
                >
                  <View style={[styles.dot, { backgroundColor: networkColor(n.native.symbol) }]} />
                  <Label bold={selected} style={{ flex: 1 }}>
                    {n.name}
                  </Label>
                  {selected && <CheckIcon size={16} color={c.accent} strokeWidth={2.4} />}
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

/** 목록을 펼친 줄이 아래 카드보다 위에 그려지게 하는 zIndex */
export const MENU_LAYER = { zIndex: 10 };

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    button: {
      minHeight: 44,
      paddingLeft: 12,
      paddingRight: 14,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    dot: { width: 10, height: 10, borderRadius: 5 },
    backdrop: { position: 'absolute', top: -200, left: -200, width: 2000, height: 2000 },
    menu: {
      position: 'absolute',
      top: 50,
      left: 0,
      minWidth: 220,
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
