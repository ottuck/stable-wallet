import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatAmount } from '@/core/amount';
import type { WalletTx } from '@/core/history';
import { shortAddress, shortHash } from '@/features/format';
import { useT } from '@/features/i18n';
import { ClockIcon } from '@/features/icons';
import { Label, useColors, useThemed, type Palette } from '@/features/ui';

/** 보낸 거래 한 줄(홈·보낸 거래 화면). 누르면 거래 상세를 연다. */
export function TxRow({ tx, last }: { tx: WalletTx; last: boolean }) {
  const c = useColors();
  const t = useT();
  const styles = useThemed(makeStyles);
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push({ pathname: '/tx', params: { hash: tx.hash } })}
      style={[styles.row, !last && styles.rowLine]}
    >
      <View style={{ gap: 4, flexShrink: 1 }}>
        <Label bold>{`−${formatAmount(BigInt(tx.amount), tx.decimals, 2)} ${tx.symbol}`}</Label>
        <Label mono muted size={12}>
          {`→ ${shortAddress(tx.toAddress)} · ${shortHash(tx.hash)}`}
        </Label>
      </View>
      {tx.status === 'pending' ? (
        <View style={styles.status}>
          <ClockIcon size={14} color={c.warn} strokeWidth={2.4} />
          <Label bold size={13} color={c.warn}>
            {t.home.pending}
          </Label>
        </View>
      ) : tx.status === 'confirmed' ? (
        <Label muted size={13}>
          {t.home.date(new Date(tx.createdAt))}
        </Label>
      ) : (
        <Label bold size={13} color={c.danger}>
          {tx.status === 'failed' ? t.home.failed : t.home.dropped}
        </Label>
      )}
    </Pressable>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
    },
    rowLine: { borderBottomWidth: 1, borderBottomColor: c.line },
    status: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  });
