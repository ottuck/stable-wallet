import * as Clipboard from 'expo-clipboard';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { formatAmount } from '@/core/amount';
import { activeNetworks } from '@/core/config/networks';
import type { AssetBalance } from '@/core/evm/balances';
import type { WalletTx } from '@/core/history';
import { withSigner } from '@/core/keys/vault';
import { errorMessage } from '@/features/error-message';
import { formatDate, openExplorer, shortAddress, shortHash } from '@/features/format';
import { useRecentTxs } from '@/features/history/use-recent-txs';
import { useBalances } from '@/features/home/use-balances';
import {
  ChevronDownIcon,
  ClockIcon,
  CopyIcon,
  ReceiveIcon,
  ScanIcon,
  SendIcon,
} from '@/features/icons';
import { useNetwork } from '@/features/network-store';
import {
  Address,
  Button,
  Card,
  colors,
  IconButton,
  Label,
  networkColor,
  Screen,
  TokenIcon,
} from '@/features/ui';
import { useWallet } from '@/features/wallet/store';

export default function Home() {
  const address = useWallet((s) => s.address)!;
  const { network, setNetwork } = useNetwork();
  const { balances, transferFee, error, loading, refresh } = useBalances(network, address);
  const [refreshKey, setRefreshKey] = useState(0);
  const txs = useRecentTxs(network, address, refreshKey);

  const reload = useCallback(() => {
    refresh();
    setRefreshKey((k) => k + 1);
  }, [refresh]);

  // 보내기에서 돌아오면 잔액·거래를 다시 읽는다(처음 열 때는 이미 읽는 중)
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focusedOnce.current) reload();
      focusedOnce.current = true;
      // reload는 렌더마다 새로 만들어지므로 포커스 때만 부른다
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  function pickNetwork() {
    if (Platform.OS !== 'ios') {
      const i = activeNetworks.findIndex((n) => n.id === network.id);
      setNetwork(activeNetworks[(i + 1) % activeNetworks.length]);
      return;
    }
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [...activeNetworks.map((n) => n.name), '취소'],
        cancelButtonIndex: activeNetworks.length,
      },
      (i) => i < activeNetworks.length && setNetwork(activeNetworks[i]),
    );
  }

  // 스테이블코인 먼저, 가스용 native는 마지막
  const tokens = balances?.filter((b) => b.tokenAddress) ?? [];
  const native = balances?.find((b) => !b.tokenAddress);

  return (
    <Screen onRefresh={reload}>
      <View style={styles.topRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`네트워크: ${network.name}. 바꾸기`}
          onPress={pickNetwork}
          style={styles.networkButton}
        >
          <View style={[styles.dot, { backgroundColor: networkColor(network.native.symbol) }]} />
          <Label bold>{network.name}</Label>
          <Label mono muted size={11}>
            {String(network.chainId)}
          </Label>
          <ChevronDownIcon size={14} />
        </Pressable>
        <RpcStatus loading={loading} failed={error != null} />
      </View>

      <Card style={{ gap: 14 }}>
        <View style={styles.addressRow}>
          <Address value={address} short />
          <IconButton label="주소 복사" onPress={() => void Clipboard.setStringAsync(address)}>
            <CopyIcon size={18} color={colors.muted} />
          </IconButton>
        </View>
        <View style={styles.actions}>
          <Action label="보내기" primary onPress={() => router.push('/send')}>
            <SendIcon size={22} color="#FFFFFF" strokeWidth={2.2} />
          </Action>
          <Action label="받기" onPress={() => router.push('/receive')}>
            <ReceiveIcon size={22} color={colors.accentText} strokeWidth={2.2} />
          </Action>
          <Action label="스캔" onPress={() => router.push('/scan?from=home')}>
            <ScanIcon size={22} color={colors.accentText} strokeWidth={2.2} />
          </Action>
        </View>
      </Card>

      <Card style={{ paddingVertical: 6, gap: 0 }}>
        {tokens.map((b) => (
          <TokenRow
            key={b.symbol}
            balance={b}
            onContract={() => openExplorer(network, `token/${b.tokenAddress}`)}
          />
        ))}
        {native && <NativeRow balance={native} transferFee={transferFee} />}
        {error != null && (
          <Label muted size={13} style={{ paddingVertical: 12 }}>
            {errorMessage(error)}
          </Label>
        )}
      </Card>

      <Label bold size={14} style={{ paddingHorizontal: 4 }}>
        거래
      </Label>
      <Card style={{ paddingVertical: 4, gap: 0 }}>
        {txs.length === 0 ? (
          <Label muted size={13} style={{ paddingVertical: 14 }}>
            이 앱에서 보낸 거래가 여기에 쌓입니다.
          </Label>
        ) : (
          txs.map((tx, i) => (
            <TxRow
              key={tx.hash}
              tx={tx}
              last={i === txs.length - 1}
              onPress={() => openExplorer(network, `tx/${tx.hash}`)}
            />
          ))
        )}
      </Card>

      {__DEV__ && <DevTools address={address} />}
    </Screen>
  );
}

function RpcStatus({ loading, failed }: { loading: boolean; failed: boolean }) {
  const [color, text] = loading
    ? [colors.placeholder, '확인 중']
    : failed
      ? [colors.danger, 'RPC 연결 안 됨']
      : [colors.ok, 'RPC 연결됨'];
  return (
    <View style={styles.status}>
      <View style={[styles.dot, { width: 8, height: 8, backgroundColor: color }]} />
      <Label muted size={12}>
        {text}
      </Label>
    </View>
  );
}

function Action({
  label,
  primary,
  disabled,
  onPress,
  children,
}: {
  label: string;
  primary?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        {
          backgroundColor: primary ? colors.accent : colors.accentSoft,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
      ]}
    >
      {children}
      <Label bold size={13} color={primary ? '#FFFFFF' : colors.accentText}>
        {label}
      </Label>
    </Pressable>
  );
}

function TokenRow({ balance, onContract }: { balance: AssetBalance; onContract: () => void }) {
  return (
    <View style={[styles.assetRow, styles.rowLine]}>
      <View style={styles.assetName}>
        <TokenIcon symbol={balance.symbol} />
        <View style={{ gap: 2 }}>
          <Label bold>{balance.symbol}</Label>
          <Pressable accessibilityRole="link" onPress={onContract} hitSlop={8}>
            <Label mono size={11} color={colors.accent}>
              {`${shortAddress(balance.tokenAddress!)} ↗`}
            </Label>
          </Pressable>
        </View>
      </View>
      <Label mono bold size={18}>
        {formatAmount(balance.raw, balance.decimals, 2)}
      </Label>
    </View>
  );
}

function NativeRow({
  balance,
  transferFee,
}: {
  balance: AssetBalance;
  transferFee: bigint | null;
}) {
  // 지금 수수료로 ERC-20 전송을 몇 번 할 수 있는지(50번을 가득으로 본다)
  const sends = transferFee ? Number(balance.raw / transferFee) : null;
  return (
    <View style={{ paddingVertical: 12, gap: 8 }}>
      <View style={styles.assetRow}>
        <View style={styles.assetName}>
          <TokenIcon symbol={balance.symbol} />
          <View style={{ gap: 2 }}>
            <Label bold>{balance.symbol}</Label>
            <Label muted size={11}>
              가스(수수료)용
            </Label>
          </View>
        </View>
        <Label mono bold size={18}>
          {formatAmount(balance.raw, balance.decimals, 4)}
        </Label>
      </View>
      {sends !== null && (
        <View style={styles.meterRow}>
          <View style={styles.meter}>
            <View
              style={[
                styles.meterFill,
                {
                  width: `${Math.min(sends / 50, 1) * 100}%`,
                  backgroundColor: sends === 0 ? colors.danger : networkColor(balance.symbol),
                },
              ]}
            />
          </View>
          <Label muted size={11}>
            {sends === 0 ? '전송 불가 · 가스 부족' : `전송 약 ${sends > 999 ? '999+' : sends}회`}
          </Label>
        </View>
      )}
    </View>
  );
}

function TxRow({ tx, last, onPress }: { tx: WalletTx; last: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      style={[styles.assetRow, { paddingVertical: 12 }, !last && styles.rowLine]}
    >
      <View style={{ gap: 4, flexShrink: 1 }}>
        <Label bold>{`−${formatAmount(BigInt(tx.amount), tx.decimals, 2)} ${tx.symbol}`}</Label>
        <Label mono muted size={11}>
          {`→ ${shortAddress(tx.toAddress)} · ${shortHash(tx.hash)}`}
        </Label>
      </View>
      {tx.status === 'pending' ? (
        <View style={styles.status}>
          <ClockIcon size={14} color={colors.warn} strokeWidth={2.4} />
          <Label bold size={13} color={colors.warn}>
            확정 대기
          </Label>
        </View>
      ) : tx.status === 'confirmed' ? (
        <Label muted size={13}>
          {formatDate(tx.createdAt)}
        </Label>
      ) : (
        <Label bold size={13} color={colors.danger}>
          {tx.status === 'failed' ? '실패' : '전송 안 됨'}
        </Label>
      )}
    </Pressable>
  );
}

/** PoC 확인용. 개발 빌드에서만 보인다. */
function DevTools({ address }: { address: string }) {
  const [check, setCheck] = useState<string | null>(null);

  async function checkSigner() {
    setCheck(null);
    const started = Date.now();
    try {
      const same = await withSigner(async (signer) => signer.address === address);
      setCheck(`${same ? '일치' : '불일치'} · ${Date.now() - started}ms`);
    } catch (e) {
      setCheck(errorMessage(e));
    }
  }

  function confirmDelete() {
    Alert.alert('개발용: 지갑을 지울까요?', '복구 문구가 없으면 되돌릴 수 없습니다.', [
      { text: '취소', style: 'cancel' },
      { text: '지우기', style: 'destructive', onPress: () => void useWallet.getState().reset() },
    ]);
  }

  return (
    <Card>
      <Label muted size={12}>
        개발용
      </Label>
      <Button title="Face ID로 서명 키 확인" secondary onPress={() => void checkSigner()} />
      {check && <Label size={13}>{check}</Label>}
      <Button title="지갑 지우기" secondary onPress={confirmDelete} />
    </Card>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  networkButton: {
    height: 44,
    paddingLeft: 12,
    paddingRight: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: -8,
    marginRight: -10,
  },
  actions: { flexDirection: 'row', gap: 8 },
  action: {
    flex: 1,
    height: 72,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  assetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLine: { borderBottomWidth: 1, borderBottomColor: colors.line },
  assetName: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  meterRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 48 },
  meter: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.line },
  meterFill: { height: 6, borderRadius: 3 },
});
