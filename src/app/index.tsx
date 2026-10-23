import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { formatAmount } from '@/core/amount';
import { tokensOn } from '@/core/config/tokens';
import type { AssetBalance } from '@/core/evm/balances';
import type { WalletTx } from '@/core/history';
import { withSigner } from '@/core/keys/vault';
import { HenryCoin } from '@/features/brand';
import { CopyButton } from '@/features/copy-button';
import { errorMessage } from '@/features/error-message';
import { openExplorer, shortAddress, shortHash } from '@/features/format';
import { useRecentTxs } from '@/features/history/use-recent-txs';
import { MENU_LAYER } from '@/features/dropdown';
import { NetworkPicker } from '@/features/home/network-picker';
import { useBalances } from '@/features/home/use-balances';
import { useT } from '@/features/i18n';
import { LanguageSwitch } from '@/features/i18n/language-switch';
import { ClockIcon, ReceiveIcon, ScanIcon, SendIcon } from '@/features/icons';
import { useNetwork } from '@/features/network-store';
import {
  Address,
  Button,
  Card,
  Label,
  networkColor,
  Screen,
  TokenIcon,
  useColors,
  useThemed,
  type Palette,
} from '@/features/ui';
import { useWallet } from '@/features/wallet/store';

export default function Home() {
  const c = useColors();
  const t = useT();
  const styles = useThemed(makeStyles);
  const address = useWallet((s) => s.address)!;
  const network = useNetwork((s) => s.network);
  const { balances, transferFee, error, refresh } = useBalances(network, address);
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

  // 스테이블코인은 큰 잔액으로, 가스용 native는 따로
  const native = balances?.find((b) => !b.tokenAddress);
  const stables = tokensOn(network.id).map((token) => ({
    token,
    balance: balances?.find((b) => b.tokenAddress === token.address),
  }));

  return (
    <Screen onRefresh={reload}>
      <View style={[styles.topRow, MENU_LAYER]}>
        <NetworkPicker />
        <LanguageSwitch />
      </View>

      <Card style={{ gap: 16 }}>
        <View style={styles.addressRow}>
          <View style={{ gap: 2 }}>
            <Label muted size={12}>
              {t.home.myAddress}
            </Label>
            <Address value={address} short />
          </View>
          <CopyButton value={address} />
        </View>

        <View style={styles.stables}>
          {stables.map(({ token, balance }) => (
            <TokenRow
              key={token.symbol}
              symbol={token.symbol}
              address={token.address}
              amount={
                balance ? formatAmount(balance.raw, balance.decimals, 2) : error != null ? '—' : '…'
              }
              onContract={() => openExplorer(network, `token/${token.address}`)}
            />
          ))}
          {error != null && (
            <Label muted size={13}>
              {errorMessage(error)}
            </Label>
          )}
        </View>

        <View style={styles.actions}>
          <Action label={t.home.send} primary onPress={() => router.push('/send')}>
            <SendIcon size={22} color={c.onPrimary} strokeWidth={2.2} />
          </Action>
          <Action label={t.home.receive} onPress={() => router.push('/receive')}>
            <ReceiveIcon size={22} color={c.accentText} strokeWidth={2.2} />
          </Action>
          <Action label={t.home.scan} onPress={() => router.push('/scan?from=home')}>
            <ScanIcon size={22} color={c.accentText} strokeWidth={2.2} />
          </Action>
        </View>
      </Card>

      {native && <GasCard balance={native} transferFee={transferFee} />}

      <Label bold size={14} style={{ paddingHorizontal: 4 }}>
        {t.home.sentTxs}
      </Label>
      <Card style={{ paddingVertical: 4, gap: 0 }}>
        {txs.length === 0 ? (
          <View style={styles.empty}>
            <View style={{ transform: [{ rotate: '-10deg' }] }}>
              <HenryCoin size={52} shadow />
            </View>
            <Label bold size={15}>
              {t.home.noTxsTitle}
            </Label>
            <Label muted size={13} style={{ lineHeight: 20, textAlign: 'center' }}>
              {t.home.noTxs}
            </Label>
          </View>
        ) : (
          txs.map((tx, i) => (
            <TxRow
              key={tx.hash}
              tx={tx}
              last={i === txs.length - 1}
              onPress={() => router.push({ pathname: '/tx', params: { hash: tx.hash } })}
            />
          ))
        )}
      </Card>

      {__DEV__ && <DevTools address={address} />}
    </Screen>
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
  const c = useColors();
  const styles = useThemed(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        {
          backgroundColor: primary ? c.primary : c.accentSoft,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
      ]}
    >
      {children}
      <Label bold size={13} color={primary ? c.onPrimary : c.accentText}>
        {label}
      </Label>
    </Pressable>
  );
}

function TokenRow({
  symbol,
  address,
  amount,
  onContract,
}: {
  symbol: string;
  address: string;
  amount: string;
  onContract: () => void;
}) {
  const c = useColors();
  const styles = useThemed(makeStyles);
  return (
    <View style={styles.assetRow}>
      <View style={styles.assetName}>
        <TokenIcon symbol={symbol} size={40} />
        <View style={{ gap: 2 }}>
          <Label bold>{symbol}</Label>
          <Pressable accessibilityRole="link" onPress={onContract} hitSlop={8}>
            <Label mono size={12} color={c.accent}>
              {`${shortAddress(address)} ↗`}
            </Label>
          </Pressable>
        </View>
      </View>
      <Label mono bold size={24} accessibilityLabel={`${symbol} ${amount}`}>
        {amount}
      </Label>
    </View>
  );
}

function GasCard({ balance, transferFee }: { balance: AssetBalance; transferFee: bigint | null }) {
  const c = useColors();
  const t = useT();
  const styles = useThemed(makeStyles);
  // 지금 수수료로 ERC-20 전송을 몇 번 할 수 있는지(50번을 가득으로 본다)
  const sends = transferFee ? Number(balance.raw / transferFee) : null;
  return (
    <Card style={{ gap: 12 }}>
      <View style={styles.assetRow}>
        <View style={styles.assetName}>
          <TokenIcon symbol={balance.symbol} size={32} />
          <View style={{ gap: 2 }}>
            <Label bold>{balance.symbol}</Label>
            <Label muted size={12}>
              {t.home.gasNote}
            </Label>
          </View>
        </View>
        <Label mono bold size={16}>
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
                  backgroundColor: sends === 0 ? c.danger : networkColor(balance.symbol),
                },
              ]}
            />
          </View>
          <Label muted size={12} color={sends === 0 ? c.danger : undefined}>
            {sends === 0 ? t.home.gasShort : t.home.sendsLeft(sends > 999 ? '999+' : String(sends))}
          </Label>
        </View>
      )}
    </Card>
  );
}

function TxRow({ tx, last, onPress }: { tx: WalletTx; last: boolean; onPress: () => void }) {
  const c = useColors();
  const t = useT();
  const styles = useThemed(makeStyles);
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      style={[styles.assetRow, { paddingVertical: 12 }, !last && styles.rowLine]}
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

/** PoC 확인용. 개발 빌드에서만 보인다. */
function DevTools({ address }: { address: string }) {
  const t = useT();
  const [check, setCheck] = useState<string | null>(null);

  async function checkSigner() {
    setCheck(null);
    const started = Date.now();
    try {
      const same = await withSigner(async (signer) => signer.address === address);
      setCheck(`${same ? t.home.devMatch : t.home.devMismatch} · ${Date.now() - started}ms`);
    } catch (e) {
      setCheck(errorMessage(e));
    }
  }

  function confirmDelete() {
    Alert.alert(t.home.devConfirmTitle, t.home.devConfirmBody, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.delete,
        style: 'destructive',
        onPress: () => void useWallet.getState().reset(),
      },
    ]);
  }

  return (
    <Card>
      <Label muted size={12}>
        {t.home.devTitle}
      </Label>
      <Button title={t.home.devCheckSigner} secondary onPress={() => void checkSigner()} />
      {check && <Label size={13}>{check}</Label>}
      <Button title={t.home.devDelete} secondary onPress={confirmDelete} />
    </Card>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    status: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    addressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginRight: -10,
    },
    stables: { gap: 2 },
    actions: { flexDirection: 'row', gap: 8 },
    empty: { alignItems: 'center', gap: 6, paddingVertical: 20, paddingHorizontal: 8 },
    action: {
      flex: 1,
      minHeight: 72,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    assetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rowLine: { borderBottomWidth: 1, borderBottomColor: c.line },
    assetName: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
    meterRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 44 },
    meter: { flex: 1, height: 6, borderRadius: 3, backgroundColor: c.line },
    meterFill: { height: 6, borderRadius: 3 },
  });
