import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatAmount } from '@/core/amount';
import { NETWORKS } from '@/core/config/networks';
import { getTx } from '@/core/history';
import { waitForTransfer } from '@/core/transfer';
import { HenryCoin } from '@/features/brand';
import { CopyButton } from '@/features/copy-button';
import { formatTime, openExplorer, shortHash } from '@/features/format';
import { useT } from '@/features/i18n';
import { AlertIcon, ClockIcon } from '@/features/icons';
import {
  Address,
  Card,
  Label,
  type Palette,
  Screen,
  TokenIcon,
  useColors,
  useThemed,
} from '@/features/ui';

/** 대기 중인 거래를 다시 확인하기까지 */
const RECHECK_MS = 10_000;

/**
 * 보낸 거래 하나의 상세. 홈의 보낸 거래 줄에서 연다(?hash=).
 * 저장된 거래만 보여주고, 아직 대기 중이면 확정을 기다려 상태를 바꾼다. 블록 탐색기는 맨 아래 링크로만 연다.
 */
export default function TxDetail() {
  const c = useColors();
  const t = useT();
  const styles = useThemed(makeStyles);
  const { hash } = useLocalSearchParams<{ hash?: string }>();
  const [tx, setTx] = useState(() => (hash ? getTx(hash) : null));

  // 대기 중이면 확정을 기다린다. RPC 오류도 pending으로 돌아오므로 다시 볼 때는 간격을 둔다
  const txHash = tx?.hash;
  const networkId = tx?.networkId;
  const pending = tx?.status === 'pending';
  useEffect(() => {
    if (!txHash || !networkId || !pending) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = () => {
      void waitForTransfer(NETWORKS[networkId], txHash).then((r) => {
        if (!active) return;
        if (r.status === 'pending') timer = setTimeout(check, RECHECK_MS);
        else setTx(getTx(txHash));
      });
    };
    check();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [txHash, networkId, pending]);

  if (!tx) {
    return (
      <Screen>
        <Label muted style={{ textAlign: 'center', paddingTop: 40 }}>
          {t.tx.notFound}
        </Label>
      </Screen>
    );
  }

  const network = NETWORKS[tx.networkId];
  const tone = tx.status === 'confirmed' ? c.ok : tx.status === 'pending' ? c.warn : c.danger;
  const sentAt = new Date(tx.createdAt);

  return (
    <Screen
      footer={
        <Pressable
          accessibilityRole="link"
          onPress={() => openExplorer(network, `tx/${tx.hash}`)}
          style={styles.explorer}
        >
          <Label bold>{t.status.viewOn(network.explorerUrl.replace('https://', ''))}</Label>
        </Pressable>
      }
    >
      <View style={styles.hero}>
        {tx.status === 'confirmed' ? (
          <HenryCoin size={72} check />
        ) : (
          <View style={[styles.badge, { backgroundColor: `${tone}1A` }]}>
            {tx.status === 'pending' ? (
              <ClockIcon size={32} color={tone} />
            ) : (
              <AlertIcon size={32} color={tone} />
            )}
          </View>
        )}
        <Label bold size={17} color={tx.status === 'confirmed' ? c.text : tone}>
          {t.status[tx.status]}
        </Label>
        {tx.status === 'failed' && (
          <Label muted size={13} style={{ textAlign: 'center', lineHeight: 19 }}>
            {t.status.failedDetail}
          </Label>
        )}
        <View style={styles.row}>
          <TokenIcon symbol={tx.symbol} size={28} />
          <Label mono bold size={28}>
            {formatAmount(BigInt(tx.amount), tx.decimals)}
          </Label>
          <Label bold size={17} muted>
            {tx.symbol}
          </Label>
        </View>
      </View>

      <Card>
        <View style={styles.headRow}>
          <Label muted size={13}>
            {t.tx.to}
          </Label>
          <CopyButton value={tx.toAddress} />
        </View>
        <Address value={tx.toAddress} size={15} />
      </Card>

      <Card style={{ gap: 12 }}>
        <Info k={t.tx.network} v={network.name} />
        <Info k={t.tx.sentAt} v={`${t.home.date(sentAt)} ${formatTime(tx.createdAt)}`} mono />
        <Info k="nonce" v={String(tx.nonce)} mono />
        <View style={styles.headRow}>
          <Info k={t.tx.hash} v={shortHash(tx.hash)} mono />
          <CopyButton value={tx.hash} label={t.tx.copyHash} />
        </View>
      </Card>
    </Screen>
  );
}

function Info({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  const styles = useThemed(makeStyles);
  return (
    <View style={styles.row}>
      <Label muted size={13} style={{ width: 96 }}>
        {k}
      </Label>
      <Label mono={mono} size={14}>
        {v}
      </Label>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    hero: { alignItems: 'center', gap: 10, paddingTop: 16, paddingBottom: 8 },
    badge: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginVertical: -8,
      marginRight: -10,
    },
    explorer: {
      height: 52,
      borderRadius: 16,
      backgroundColor: c.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
