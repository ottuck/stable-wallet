import { useState } from 'react';
import { ActionSheetIOS, Platform, Pressable, StyleSheet, View } from 'react-native';

import { activeNetworks } from '@/core/config/networks';
import { Dropdown, DropdownItem } from '@/features/dropdown';
import { useT } from '@/features/i18n';
import { ChevronDownIcon } from '@/features/icons';
import { useNetwork } from '@/features/network-store';
import { Label, networkColor, useColors, useThemed, type Palette } from '@/features/ui';

/** 홈 왼쪽 위의 네트워크 버튼. iOS는 시스템 액션 시트로, 그 밖(웹·Android)은 버튼 아래에 펼쳐지는 목록으로 고른다. */
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
    // 펼친 쪽이 옆 버튼보다 위에 오게 해서 바깥 누르기가 옆 버튼에도 먹게 한다
    <View style={open && { zIndex: 1 }}>
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

      <Dropdown open={open} onClose={() => setOpen(false)}>
        {activeNetworks.map((n) => (
          <DropdownItem
            key={n.id}
            label={n.name}
            selected={n.id === network.id}
            left={<View style={[styles.dot, { backgroundColor: networkColor(n.native.symbol) }]} />}
            onPress={() => {
              setNetwork(n);
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
  });
