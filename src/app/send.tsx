import * as Clipboard from 'expo-clipboard';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { type ComponentRef, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { parseRecipient } from '@/core/address';
import { applyAmountKey, formatAmount, parseAmount } from '@/core/amount';
import { tokensOn } from '@/core/config/tokens';
import { prepareSend } from '@/core/evm/send';
import { hasSentTo } from '@/core/history';
import { errorMessage } from '@/features/error-message';
import { useT } from '@/features/i18n';
import { useBalances } from '@/features/home/use-balances';
import { AlertIcon, CheckIcon, ScanIcon } from '@/features/icons';
import { useNetwork } from '@/features/network-store';
import { Keypad } from '@/features/send/keypad';
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

/** 금액 글자는 길어지면 단계적으로 줄여 한 줄에 둔다 */
function amountFontSize(length: number) {
  return length > 14 ? 24 : length > 11 ? 30 : length > 8 ? 36 : 44;
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
  // 받는 주소를 직접 입력하는 중(시스템 키보드). 포커스가 있는 동안에는 금액 키패드를 숨긴다
  const [typing, setTyping] = useState(false);
  const [focused, setFocused] = useState(false);
  const toInput = useRef<ComponentRef<typeof TextInput>>(null);
  // QR 스캔 화면이 돌려준 주소(t가 바뀔 때마다 새 스캔)를 받는 주소에 넣는다
  const [scanSeen, setScanSeen] = useState(scan.t);
  if (scan.t !== scanSeen) {
    setScanSeen(scan.t);
    setToText(scan.to ?? '');
    setTyping(false);
  }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 키패드는 `12.`처럼 입력 중인 모양을 만든다 — 끝의 소수점은 값에서 뺀다
  const amount = token
    ? tryParse(() => parseAmount(amountText.replace(/\.$/, ''), token.decimals))
    : null;
  const overBalance = amount !== null && balance !== null && amount > balance;
  const tokenAddresses = tokens.map((x) => x.address);
  const to = tryParse(() => parseRecipient(toText, tokenAddresses));
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
    setTyping(false);
  }

  function changeTo(text: string) {
    setToText(text);
    // 올바른 주소가 완성되면 키보드를 내리고 키패드로 돌아간다
    if (tryParse(() => parseRecipient(text, tokenAddresses)) !== null) {
      toInput.current?.blur();
      setTyping(false);
    }
  }

  if (!token) {
    return (
      <Screen>
        <Label muted>{t.send.noTokens}</Label>
      </Screen>
    );
  }

  const amountShown = amountText === '' ? '0' : amountText;

  return (
    <Screen
      footer={
        <>
          <Button
            title={t.send.review}
            busy={busy}
            disabled={amount === null || to === null || toSelf || overBalance}
            onPress={() => void next()}
          />
          {!focused && (
            <Keypad
              decimals={token.decimals}
              onKey={(key) => setAmountText((text) => applyAmountKey(text, key, token.decimals))}
              onClear={() => setAmountText('')}
            />
          )}
        </>
      }
    >
      <Stack.Screen options={{ title: t.nav.send, headerBackTitle: t.nav.home }} />
      <Label muted size={12} style={{ textAlign: 'center', marginTop: -6 }}>
        {network.name}
      </Label>

      {tokens.length > 1 && (
        <View style={styles.segment}>
          {tokens.map((x, i) => (
            <Pressable
              key={x.address}
              accessibilityRole="tab"
              accessibilityState={{ selected: i === tokenIndex }}
              onPress={() => {
                setTokenIndex(i);
                // 토큰마다 소수 자릿수가 달라 입력해 둔 금액을 그대로 쓸 수 없다
                setAmountText('');
              }}
              style={[styles.segmentItem, i === tokenIndex && styles.segmentSelected]}
            >
              <TokenIcon symbol={x.symbol} size={20} />
              <Label bold size={14} color={i === tokenIndex ? c.text : c.muted}>
                {x.symbol}
              </Label>
            </Pressable>
          ))}
        </View>
      )}

      <Card style={{ alignItems: 'center', paddingVertical: 16 }}>
        <View style={styles.amountRow}>
          <TokenIcon symbol={token.symbol} size={28} />
          <Label
            mono
            bold
            accessibilityRole="text"
            accessibilityLabel={`${t.send.amountLabel}: ${amountShown} ${token.symbol}`}
            accessibilityLiveRegion="polite"
            numberOfLines={1}
            color={overBalance ? c.danger : amountText === '' ? c.placeholder : c.text}
            style={{ fontSize: amountFontSize(amountShown.length) }}
          >
            {amountShown}
          </Label>
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
            onPress={() =>
              balance !== null &&
              setAmountText(formatAmount(balance, token.decimals, token.decimals))
            }
            hitSlop={12}
          >
            <Label bold size={13} color={c.accent}>
              {t.send.max}
            </Label>
          </Pressable>
        </View>
        {overBalance && (
          <Label size={12} color={c.danger}>
            {t.send.overBalance}
          </Label>
        )}
        {amount !== null && !overBalance && (
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
          {toText !== '' ? (
            <TextButton
              title={t.send.changeAddress}
              onPress={() => {
                setToText('');
                setTyping(false);
              }}
            />
          ) : (
            !typing && <TextButton title={t.send.typeAddress} onPress={() => setTyping(true)} />
          )}
        </View>

        {toText === '' && (
          <View style={styles.toButtons}>
            <Pressable
              accessibilityRole="button"
              onPress={() => void paste()}
              style={({ pressed }) => [styles.toButton, pressed && { opacity: 0.6 }]}
            >
              <Label bold size={14} color={c.accentText}>
                {t.send.paste}
              </Label>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/scan')}
              style={({ pressed }) => [styles.toButton, pressed && { opacity: 0.6 }]}
            >
              <ScanIcon size={18} color={c.accentText} />
              <Label bold size={14} color={c.accentText}>
                {t.send.scanQr}
              </Label>
            </Pressable>
          </View>
        )}

        {typing ? (
          <TextInput
            ref={toInput}
            accessibilityLabel={t.send.toLabel}
            value={toText}
            onChangeText={changeTo}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="0x…"
            placeholderTextColor={c.placeholder}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            autoFocus
            multiline
            returnKeyType="done"
            submitBehavior="blurAndSubmit"
            style={styles.toInput}
          />
        ) : (
          toText !== '' && <ToAddress value={to ?? toText} valid={to !== null} />
        )}

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

/** 올바른 주소는 앞뒤 네 글자를 강조한다(받는 쪽과 맞춰 보는 자리) */
function ToAddress({ value, valid }: { value: string; valid: boolean }) {
  const c = useColors();
  const styles = useThemed(makeStyles);
  if (!valid)
    return (
      <Label mono style={styles.toText}>
        {value}
      </Label>
    );
  return (
    <Label mono selectable style={styles.toText}>
      <Label mono bold color={c.accentText}>
        {value.slice(0, 6)}
      </Label>
      {value.slice(6, -4)}
      <Label mono bold color={c.accentText}>
        {value.slice(-4)}
      </Label>
    </Label>
  );
}

/** 보조 동작은 아이콘 대신 글자로(뜻이 바로 읽히게). */
function TextButton({ title, onPress }: { title: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <Label bold size={13} color={c.accent}>
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
    balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    toHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    toButtons: { flexDirection: 'row', gap: 10 },
    toButton: {
      flex: 1,
      height: 48,
      borderRadius: 14,
      backgroundColor: c.accentSoft,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    toText: { lineHeight: 22 },
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
