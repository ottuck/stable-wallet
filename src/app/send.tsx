import * as Clipboard from 'expo-clipboard';
import { router, Stack } from 'expo-router';
import { formatUnits } from 'ethers';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { parseRecipient } from '@/core/address';
import { formatAmount, parseAmount } from '@/core/amount';
import { tokensOn } from '@/core/config/tokens';
import { prepareSend } from '@/core/evm/send';
import { hasSentTo } from '@/core/history';
import { errorMessage } from '@/features/error-message';
import { useBalances } from '@/features/home/use-balances';
import { AlertIcon, CheckIcon } from '@/features/icons';
import { useNetwork } from '@/features/network-store';
import { useSendFlow } from '@/features/send/store';
import { Button, Card, colors, fonts, Label, Screen, TokenIcon } from '@/features/ui';
import { useWallet } from '@/features/wallet/store';

function tryParse<T>(fn: () => T): T | null {
  try {
    return fn();
  } catch {
    return null;
  }
}

export default function SendInput() {
  const address = useWallet((s) => s.address)!;
  const network = useNetwork((s) => s.network);
  const tokens = tokensOn(network.id);
  const [tokenIndex, setTokenIndex] = useState(0);
  const token = tokens[tokenIndex];
  const { balances } = useBalances(network, address);
  const balance = balances?.find((b) => b.tokenAddress === token?.address)?.raw ?? null;

  const [amountText, setAmountText] = useState('');
  const [toText, setToText] = useState('');
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
        <Label muted>이 네트워크에는 보낼 수 있는 토큰이 없습니다.</Label>
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <Button
          title="확인하기"
          busy={busy}
          disabled={amount === null || to === null || toSelf}
          onPress={() => void next()}
        />
      }
    >
      <Stack.Screen options={{ title: '보내기', headerBackTitle: '홈' }} />
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
              <Label bold size={14} color={i === tokenIndex ? colors.text : colors.muted}>
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
            accessibilityLabel="보낼 금액"
            value={amountText}
            onChangeText={setAmountText}
            placeholder="0"
            placeholderTextColor={colors.placeholder}
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
            잔액{' '}
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
            <Label bold size={13} color={colors.accent}>
              최대
            </Label>
          </Pressable>
        </View>
        {amountText !== '' && amount === null && (
          <Label size={12} color={colors.danger}>
            {`금액을 확인해 주세요 (소수점 ${token.decimals}자리까지)`}
          </Label>
        )}
        {amount !== null && (
          <Label mono muted size={11}>
            {`raw ${amount.toString()} · decimals ${token.decimals}`}
          </Label>
        )}
      </Card>

      <Card>
        <View style={styles.toHeader}>
          <Label muted size={12}>
            받는 주소
          </Label>
          <View style={styles.toActions}>
            <TextButton title="붙여넣기" onPress={() => void paste()} />
            <TextButton title="QR 스캔" disabled onPress={() => {}} />
          </View>
        </View>
        <TextInput
          accessibilityLabel="받는 주소"
          value={toText}
          onChangeText={setToText}
          placeholder="0x…"
          placeholderTextColor={colors.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          multiline
          style={styles.toInput}
        />
        {toText !== '' && (
          <View style={styles.checks}>
            {to === null ? (
              <Hint color={colors.danger} icon="alert">
                주소 형식·체크섬이 맞지 않거나 토큰 컨트랙트 주소입니다
              </Hint>
            ) : toSelf ? (
              <Hint color={colors.danger} icon="alert">
                내 주소로는 보낼 수 없습니다
              </Hint>
            ) : (
              <>
                <Hint color={colors.muted} icon="check">
                  체크섬이 맞고, 토큰 컨트랙트 주소가 아닙니다
                </Hint>
                {firstTime && (
                  <Hint color={colors.warn} icon="alert">
                    처음 보내는 주소예요. 앞뒤 네 글자를 받는 쪽과 맞춰 보세요
                  </Hint>
                )}
              </>
            )}
          </View>
        )}
      </Card>

      {error && <Label color={colors.danger}>{error}</Label>}
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <Label bold size={13} color={disabled ? colors.placeholder : colors.accent}>
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
  return (
    <View style={styles.hint}>
      {icon === 'check' ? (
        <CheckIcon size={14} color={colors.accent} strokeWidth={3} />
      ) : (
        <AlertIcon size={14} color={color} strokeWidth={2.4} />
      )}
      <Label size={12} color={color} style={{ flexShrink: 1 }}>
        {children}
      </Label>
    </View>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', backgroundColor: '#E9EBEF', borderRadius: 12, padding: 4 },
  segmentItem: {
    flex: 1,
    height: 44,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  segmentSelected: { backgroundColor: colors.card },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  amountInput: {
    minWidth: 80,
    maxWidth: 220,
    fontFamily: fonts.monoBold,
    fontSize: 40,
    color: colors.text,
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
    color: colors.text,
    padding: 0,
    textAlignVertical: 'center',
  },
  checks: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 10,
    gap: 6,
  },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
