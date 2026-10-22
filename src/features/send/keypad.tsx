import { Pressable, StyleSheet, View } from 'react-native';

import type { AmountKey } from '@/core/amount';
import { useT } from '@/features/i18n';
import { BackspaceIcon } from '@/features/icons';
import { fonts, Label, type Palette, useColors, useThemed } from '@/features/ui';

const ROWS: AmountKey[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'back'],
];

/** 금액 전용 숫자 키패드. 키를 누르면 onKey, 지우기를 길게 누르면 onClear. 문자열 규칙은 core/amount가 정한다. */
export function Keypad({
  onKey,
  onClear,
  decimals,
}: {
  onKey: (key: AmountKey) => void;
  onClear: () => void;
  /** 0이면 소수점 키를 쓸 수 없다 */
  decimals: number;
}) {
  const c = useColors();
  const t = useT();
  const styles = useThemed(makeStyles);
  return (
    <View style={styles.pad}>
      {ROWS.map((row) => (
        <View key={row.join('')} style={styles.row}>
          {row.map((key) => {
            const unused = key === '.' && decimals === 0;
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={
                  key === 'back' ? t.send.deleteDigit : key === '.' ? t.send.decimalPoint : key
                }
                accessibilityState={{ disabled: unused }}
                disabled={unused}
                onPress={() => onKey(key)}
                onLongPress={key === 'back' ? onClear : undefined}
                style={({ pressed }) => [styles.key, pressed && styles.pressed]}
              >
                {key === 'back' ? (
                  <BackspaceIcon size={24} color={c.text} />
                ) : (
                  <Label style={styles.digit} color={unused ? c.placeholder : c.text}>
                    {key}
                  </Label>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    pad: { gap: 6 },
    row: { flexDirection: 'row', gap: 6 },
    key: {
      flex: 1,
      height: 46,
      borderRadius: 14,
      backgroundColor: c.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: { backgroundColor: c.accentSoft },
    digit: { fontFamily: fonts.mono, fontSize: 22, fontWeight: undefined },
  });
