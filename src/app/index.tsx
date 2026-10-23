import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { formatAmount } from '@/core/amount';
import { tokensOn } from '@/core/config/tokens';
import type { AssetBalance } from '@/core/evm/balances';
import { withSigner } from '@/core/keys/vault';
import { HenryCoin } from '@/features/brand';
import { CopyButton } from '@/features/copy-button';
import { errorMessage } from '@/features/error-message';
import { MENU_LAYER } from '@/features/dropdown';
import { openExplorer, shortAddress } from '@/features/format';
import { TxRow } from '@/features/history/tx-row';
import { useRecentTxs } from '@/features/history/use-recent-txs';
import { NetworkPicker } from '@/features/home/network-picker';
import { useBalances } from '@/features/home/use-balances';
import { useT } from '@/features/i18n';
import { LanguageSwitch } from '@/features/i18n/language-switch';
import { ChevronRightIcon, ReceiveIcon, ScanIcon, SendIcon } from '@/features/icons';
import { useNetwork } from '@/features/network-store';
import {
  Address,
  Button,
  Card,
  Label,
  Screen,
  TokenIcon,
  useColors,
  useThemed,
  type Palette,
} from '@/features/ui';
import { useWallet } from '@/features/wallet/store';

/** 홈에 보이는 보낸 거래 수. 더 있으면 "전체 보기"로 보낸 거래 화면을 연다 */
const HOME_TXS = 5;

export default function Home() {
  const c = useColors();
  const t = useT();
  const styles = useThemed(makeStyles);
  const address = useWallet((s) => s.address)!;
  const network = useNetwork((s) => s.network);
  const { balances, transferFee, error, refresh } = useBalances(network, address);
  const [refreshKey, setRefreshKey] = useState(0);
  // 하나 더 읽어서 홈에 다 못 보인 거래가 있는지 안다
  const recent = useRecentTxs(network, address, refreshKey, HOME_TXS + 1);
  const txs = recent.slice(0, HOME_TXS);
  const more = recent.length > HOME_TXS;

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

  // 스테이블코인은 큰 잔액으로, 가스용 native는 그 아래 한 줄로
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

        {native && <GasLine balance={native} transferFee={transferFee} />}
      </Card>

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

      <View style={styles.sectionHead}>
        <Label bold size={14}>
          {t.home.sentTxs}
        </Label>
        {more && (
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push('/history')}
            hitSlop={10}
            style={styles.seeAll}
          >
            <Label size={13} color={c.accent}>
              {t.home.seeAll}
            </Label>
            <ChevronRightIcon size={14} color={c.accent} strokeWidth={2.4} />
          </Pressable>
        )}
      </View>
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
          txs.map((tx, i) => <TxRow key={tx.hash} tx={tx} last={i === txs.length - 1} />)
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
          backgroundColor: primary ? c.primary : c.card,
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

/** 잔액 카드 맨 아래 한 줄: 가스용 native 잔액과, 지금 수수료로 ERC-20 전송을 몇 번 할 수 있는지 */
function GasLine({ balance, transferFee }: { balance: AssetBalance; transferFee: bigint | null }) {
  const c = useColors();
  const t = useT();
  const styles = useThemed(makeStyles);
  const sends = transferFee ? Number(balance.raw / transferFee) : null;
  const short = sends === 0;
  return (
    <View style={styles.gasLine}>
      <View style={styles.gasName}>
        <TokenIcon symbol={balance.symbol} size={22} />
        <Label mono bold size={14}>
          {`${formatAmount(balance.raw, balance.decimals, 4)} ${balance.symbol}`}
        </Label>
        <Label muted size={12}>
          {t.home.gasFor}
        </Label>
      </View>
      {sends !== null && (
        <Label
          muted={!short}
          bold={short}
          size={12}
          color={short ? c.danger : undefined}
          style={{ flexShrink: 1, textAlign: 'right' }}
        >
          {short ? t.home.gasShort : t.home.sendsLeft(sends > 999 ? '999+' : String(sends))}
        </Label>
      )}
    </View>
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
    addressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginRight: -10,
    },
    stables: { gap: 2 },
    actions: { flexDirection: 'row', gap: 10 },
    sectionHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 4,
      marginTop: 4,
    },
    seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    empty: { alignItems: 'center', gap: 6, paddingVertical: 20, paddingHorizontal: 8 },
    action: {
      flex: 1,
      minHeight: 76,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    assetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    assetName: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
    gasLine: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: c.line,
    },
    gasName: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  });
