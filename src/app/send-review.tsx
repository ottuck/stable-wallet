import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatAmount } from '@/core/amount';
import { hasGasBalance, hasTokenBalance } from '@/core/evm/send';
import { submitTransfer } from '@/core/transfer';
import { errorMessage } from '@/features/error-message';
import { useT } from '@/features/i18n';
import { formatGwei, shortAddress } from '@/features/format';
import { AlertIcon, CheckIcon, ChevronDownIcon, FaceIdIcon } from '@/features/icons';
import { useSendFlow } from '@/features/send/store';
import {
  Address,
  Button,
  Card,
  Label,
  networkColor,
  type Palette,
  Screen,
  TokenIcon,
  useColors,
  useThemed,
} from '@/features/ui';

export default function SendReview() {
  const c = useColors();
  const t = useT();
  const styles = useThemed(makeStyles);
  const p = useSendFlow((s) => s.preview);
  const [busy, setBusy] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!p) return null;
  const native = p.network.native;
  const tokenOk = hasTokenBalance(p);
  const gasOk = hasGasBalance(p);
  const checks: { label: string; ok: boolean; detail?: string }[] = [
    // 입력 화면에서 parseRecipient를 통과한 주소만 여기에 온다
    { label: t.review.addressFormat, ok: true },
    { label: t.review.notContract, ok: true },
    {
      label: t.review.balanceCheck(p.token.symbol),
      ok: tokenOk,
      detail: `${formatAmount(p.tokenBalance, p.token.decimals)} ≥ ${formatAmount(p.amount, p.token.decimals)}`,
    },
    {
      label: t.review.gasCheck(native.symbol),
      ok: gasOk,
      detail:
        p.maxFee === null
          ? t.review.notComputed
          : `${formatAmount(p.nativeBalance, native.decimals, 4)} ≥ ${formatAmount(p.maxFee, native.decimals, 4)}`,
    },
    { label: t.review.network, ok: true, detail: String(p.network.chainId) },
  ];
  const passed = checks.filter((check) => check.ok).length;

  async function send() {
    if (!p) return;
    setBusy(true);
    setError(null);
    try {
      const sent = await submitTransfer(p);
      // 이 확인 화면의 거래일 때만 상태 화면으로 넘긴다
      if (useSendFlow.getState().preview !== p) {
        setBusy(false);
        return;
      }
      useSendFlow.getState().setSent(sent.hash, sent.uncertain);
      router.replace('/send-status');
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <Screen
      footer={
        <>
          {error && (
            <Label size={13} color={c.danger}>
              {error}
            </Label>
          )}
          <Button
            title={t.review.sign}
            icon={<FaceIdIcon size={20} color={c.onPrimary} />}
            busy={busy}
            disabled={!tokenOk || !gasOk}
            onPress={() => void send()}
          />
        </>
      }
    >
      {/* 서명·전송 중에는 뒤로 갈 수 없다 */}
      <Stack.Screen
        options={{ title: t.nav.review, headerBackVisible: !busy, gestureEnabled: !busy }}
      />

      <Card>
        <View style={styles.between}>
          <View style={styles.amount}>
            <TokenIcon symbol={p.token.symbol} size={30} />
            <Label mono bold size={30}>
              {formatAmount(p.amount, p.token.decimals)}
            </Label>
            <Label bold muted>
              {p.token.symbol}
            </Label>
          </View>
          <View style={styles.network}>
            <View style={[styles.dot, { backgroundColor: networkColor(native.symbol) }]} />
            <Label muted size={13}>
              {p.network.name}
            </Label>
          </View>
        </View>
        {[
          [t.review.from, p.from],
          [t.review.to, p.to],
        ].map(([label, value]) => (
          <View key={label} style={styles.party}>
            <Label muted size={12} style={styles.partyLabel}>
              {label}
            </Label>
            <View style={{ flex: 1 }}>
              <Address value={value} size={12} />
            </View>
          </View>
        ))}
      </Card>

      <Card style={{ gap: 9 }}>
        <Label bold muted size={12}>
          {t.review.checks(passed, checks.length)}
        </Label>
        {checks.map((check) => (
          <View key={check.label} style={styles.between}>
            <View style={styles.check}>
              {check.ok ? (
                <CheckIcon size={16} color={c.ok} strokeWidth={3} />
              ) : (
                <AlertIcon size={16} color={c.danger} strokeWidth={2.4} />
              )}
              <Label size={13} color={check.ok ? c.text : c.danger}>
                {check.label}
              </Label>
            </View>
            {check.detail && (
              <Label mono muted size={12}>
                {check.detail}
              </Label>
            )}
          </View>
        ))}
      </Card>

      <Card style={{ gap: 10 }}>
        <Label bold muted size={12}>
          {t.review.fees}
        </Label>
        <View style={styles.between}>
          <Label size={13}>{t.review.estimated}</Label>
          <Label mono size={13}>
            {p.estimatedFee === null
              ? '—'
              : `≈ ${formatAmount(p.estimatedFee, native.decimals, 6)} ${native.symbol}`}
          </Label>
        </View>
        <View style={styles.between}>
          <Label size={13}>{t.review.maximum}</Label>
          <Label mono size={13}>
            {p.maxFee === null
              ? '—'
              : `${formatAmount(p.maxFee, native.decimals, 6)} ${native.symbol}`}
          </Label>
        </View>
      </Card>

      <Card style={{ gap: 12 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: showRaw }}
          onPress={() => setShowRaw((v) => !v)}
          hitSlop={8}
          style={styles.between}
        >
          <Label bold muted size={12}>
            {t.review.details}
          </Label>
          <View style={{ transform: [{ rotate: showRaw ? '180deg' : '0deg' }] }}>
            <ChevronDownIcon size={16} color={c.muted} />
          </View>
        </Pressable>
        {showRaw && (
          <View style={styles.raw}>
            <Raw k="to" v={`${shortAddress(p.token.address)} ${p.token.symbol}`} />
            <Raw k="data" v={`transfer(${shortAddress(p.to)}, ${p.amount})`} />
            <Raw k="value" v="0" />
            <Raw k="nonce" v={String(p.nonce)} />
            <Raw
              k="gasLimit"
              v={p.gasLimit === null ? '—' : `${p.gasLimit.toLocaleString()} (+20%)`}
            />
            <Raw
              k="maxFee"
              v={p.maxFeePerGas === null ? '—' : `${formatGwei(p.maxFeePerGas)} gwei`}
            />
            <Raw
              k="tip"
              v={
                p.maxPriorityFeePerGas === null ? '—' : `${formatGwei(p.maxPriorityFeePerGas)} gwei`
              }
            />
          </View>
        )}
      </Card>
    </Screen>
  );
}

function Raw({ k, v }: { k: string; v: string }) {
  const styles = useThemed(makeStyles);
  return (
    <View style={styles.rawRow}>
      <Label mono muted size={12} style={{ width: 84 }}>
        {k}
      </Label>
      <Label mono size={12} style={{ flex: 1 }}>
        {v}
      </Label>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    amount: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    network: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    party: { flexDirection: 'row' },
    partyLabel: { width: 44, paddingTop: 2 },
    check: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    raw: { backgroundColor: c.soft, borderRadius: 12, padding: 12, gap: 4 },
    rawRow: { flexDirection: 'row' },
  });
