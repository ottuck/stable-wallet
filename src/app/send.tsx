import * as Clipboard from 'expo-clipboard';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { formatUnits } from 'ethers';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { parseRecipient } from '@/core/address';
import { formatAmount, parseAmount } from '@/core/amount';
import { tokensOn } from '@/core/config/tokens';
import { prepareSend } from '@/core/evm/send';
import { hasSentTo } from '@/core/history';
import { errorMessage } from '@/features/error-message';
import { useT } from '@/features/i18n';
import { useBalances } from '@/features/home/use-balances';
import { AlertIcon, CheckIcon } from '@/features/icons';
import { useNetwork } from '@/features/network-store';
import { useSendFlow } from '@/features/send/store';
import {
  Button,
  Card,
  fonts,
  Label,
  type Palette,
  Screen,
  TokenIcon,
  useColors,
  useThemed,
} from '@/features/ui';
import { useWallet } from '@/features/wallet/store';

function tryParse<T>(fn: () => T): T | null {
  try {
    return fn();
  } catch {
    return null;
  }
}

export default function SendInput() {
  const c = useColors();
  const t = useT();
  const styles = useThemed(makeStyles);
  const address = useWallet((s) => s.address)!;
  const network = useNetwork((s) => s.network);
  const tokens = tokensOn(network.id);
  const [tokenIndex, setTokenIndex] = useState(0);
  const token = tokens[tokenIndex];
  const { balances } = useBalances(network, address);
  const balance = balances?.find((b) => b.tokenAddress === token?.address)?.raw ?? null;

  const [amountText, setAmountText] = useState('');
  const scan = useLocalSearchParams<{ to?: string; t?: string }>();
  const [toText, setToText] = useState(scan.to ?? '');
  // QR 스캔 화면이 돌려준 주소(t가 바뀔 때마다 새 스캔)를 받는 주소에 넣는다
  const [scanSeen, setScanSeen] = useState(scan.t);
  if (scan.t !== scanSeen) {
    setScanSeen(scan.t);
    setToText(scan.to ?? '');
  }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount = token ? tryParse(() => parseAmount(amountText, token.decimals)) : null;
  const to = tryParse(() =>
    parseRecipient(
      toText,
      tokensOn(network.id).map((t) => t.address),
    ),
  );
  const toSelf = to !== null && to.toLowerCase() === address.toLowerCase();
  const firstTime = to !== null && !toSelf && !hasSentTo(address, to);

  async function next() {
    if (!token || amount === null || to === null) return;
    setBusy(true);
    setError(null);
    try {
      const preview = await prepareSend({ network, token, from: address, to, amount });
      useSendFlow.getState().setPreview(preview);
      router.push('/send-review');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function paste() {
    setToText((await Clipboard.getStringAsync()).trim());
  }

  if (!token) {
    return (
      <Screen>
        <Label muted>{t.send.noTokens}</Label>
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <Button
          title={t.send.review}
          busy={busy}
          disabled={amount === null || to === null || toSelf}
          onPress={() => void next()}
        />
      }
    >
      <Stack.Screen options={{ title: t.nav.send, headerBackTitle: t.nav.home }} />
      <Label muted size={12} style={{ textAlign: 'center', marginTop: -6 }}>
        {network.name}
      </Label>

      {tokens.length > 1 && (
        <View style={styles.segment}>
          {tokens.map((t, i) => (
            <Pressable
              key={t.address}
              accessibilityRole="tab"
              accessibilityState={{ selected: i === tokenIndex }}
              onPress={() => setTokenIndex(i)}
              style={[styles.segmentItem, i === tokenIndex && styles.segmentSelected]}
            >
              <TokenIcon symbol={t.symbol} size={20} />
              <Label bold size={14} color={i === tokenIndex ? c.text : c.muted}>
                {t.symbol}
              </Label>
            </Pressable>
          ))}
        </View>
      )}

      <Card style={{ alignItems: 'center', paddingVertical: 22 }}>
        <View style={styles.amountRow}>
          <TokenIcon symbol={token.symbol} size={28} />
          <TextInput
            accessibilityLabel={t.send.amountLabel}
            value={amountText}
            onChangeText={setAmountText}
            placeholder="0"
            placeholderTextColor={c.placeholder}
            keyboardType="decimal-pad"
            autoFocus
            style={styles.amountInput}
          />
          <Label bold muted size={18}>
            {token.symbol}
          </Label>
        </View>
        <View style={styles.balanceRow}>
          <Label muted size={12}>
            {t.send.balance}{' '}
            <Label mono muted size={12}>
              {balance === null ? '…' : formatAmount(balance, token.decimals)}
            </Label>
          </Label>
          <Pressable
            accessibilityRole="button"
            disabled={balance === null}
            onPress={() => balance !== null && setAmountText(formatUnits(balance, token.decimals))}
            hitSlop={12}
          >
            <Label bold size={13} color={c.accent}>
              {t.send.max}
            </Label>
          </Pressable>
        </View>
        {amountText !== '' && amount === null && (
          <Label size={12} color={c.danger}>
            {t.send.badAmount(token.decimals)}
          </Label>
        )}
        {amount !== null && (
          <Label mono muted size={12}>
            {`raw ${amount.toString()} · decimals ${token.decimals}`}
          </Label>
        )}
      </Card>

      <Card>
        <View style={styles.toHeader}>
          <Label muted size={12}>
            {t.send.toLabel}
          </Label>
          <View style={styles.toActions}>
            <TextButton title={t.send.paste} onPress={() => void paste()} />
            <TextButton title={t.send.scanQr} onPress={() => router.push('/scan')} />
          </View>
        </View>
        <TextInput
          accessibilityLabel={t.send.toLabel}
          value={toText}
          onChangeText={setToText}
          placeholder="0x…"
          placeholderTextColor={c.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          multiline
          style={styles.toInput}
        />
        {toText !== '' && (
          <View style={styles.checks}>
            {to === null ? (
              <Hint color={c.danger} icon="alert">
                {t.send.badAddress}
              </Hint>
            ) : toSelf ? (
              <Hint color={c.danger} icon="alert">
                {t.send.toSelf}
              </Hint>
            ) : (
              <>
                <Hint color={c.muted} icon="check">
                  {t.send.checksumOk}
                </Hint>
                {firstTime && (
                  <Hint color={c.warn} icon="alert">
                    {t.send.firstTime}
                  </Hint>
                )}
              </>
            )}
          </View>
        )}
      </Card>

      {error && <Label color={c.danger}>{error}</Label>}
    </Screen>
  );
}

/** 보조 동작은 아이콘 대신 글자로(뜻이 바로 읽히게). disabled는 아직 준비 중인 기능. */
function TextButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <Label bold size={13} color={disabled ? c.placeholder : c.accent}>
        {title}
      </Label>
    </Pressable>
  );
}

function Hint({
  color,
  icon,
  children,
}: {
  color: string;
  icon: 'check' | 'alert';
  children: React.ReactNode;
}) {
  const c = useColors();
  const styles = useThemed(makeStyles);
  return (
    <View style={styles.hint}>
      {icon === 'check' ? (
        <CheckIcon size={14} color={c.ok} strokeWidth={3} />
      ) : (
        <AlertIcon size={14} color={color} strokeWidth={2.4} />
      )}
      <Label size={12} color={color} style={{ flexShrink: 1 }}>
        {children}
      </Label>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    segment: { flexDirection: 'row', backgroundColor: c.segment, borderRadius: 12, padding: 4 },
    segmentItem: {
      flex: 1,
      height: 44,
      borderRadius: 9,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    segmentSelected: { backgroundColor: c.card },
    amountRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    amountInput: {
      minWidth: 80,
      maxWidth: 220,
      fontFamily: fonts.monoBold,
      fontSize: 40,
      color: c.text,
      textAlign: 'center',
      padding: 0,
    },
    balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    toHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    toActions: { flexDirection: 'row', gap: 18 },
    toInput: {
      minHeight: 44,
      fontFamily: fonts.mono,
      fontSize: 14,
      color: c.text,
      padding: 0,
      textAlignVertical: 'center',
    },
    checks: {
      borderTopWidth: 1,
      borderTopColor: c.line,
      paddingTop: 10,
      gap: 6,
    },
    hint: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  });
