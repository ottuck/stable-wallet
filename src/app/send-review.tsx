import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatAmount } from '@/core/amount';
import { WalletError } from '@/core/errors';
import { broadcast, hasGasBalance, hasTokenBalance, signTransfer } from '@/core/evm/send';
import { saveTx, updateTxStatus } from '@/core/history';
import { withSigner } from '@/core/keys/vault';
import { errorMessage } from '@/features/error-message';
import { formatGwei, shortAddress } from '@/features/format';
import { AlertIcon, CheckIcon, FaceIdIcon } from '@/features/icons';
import { useSendFlow } from '@/features/send/store';
import {
  Address,
  Button,
  Card,
  colors,
  Label,
  networkColor,
  Screen,
  TokenIcon,
} from '@/features/ui';

export default function SendReview() {
  const p = useSendFlow((s) => s.preview);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!p) return null;
  const native = p.network.native;
  const tokenOk = hasTokenBalance(p);
  const gasOk = hasGasBalance(p);
  const checks: { label: string; ok: boolean; detail?: string }[] = [
    // 입력 화면에서 parseRecipient를 통과한 주소만 여기에 온다
    { label: '주소 체크섬(EIP-55)', ok: true },
    { label: '토큰 컨트랙트로 보내지 않음', ok: true },
    {
      label: `${p.token.symbol} 잔액`,
      ok: tokenOk,
      detail: `${formatAmount(p.tokenBalance, p.token.decimals)} ≥ ${formatAmount(p.amount, p.token.decimals)}`,
    },
    {
      label: `가스 ${native.symbol}`,
      ok: gasOk,
      detail:
        p.maxFee === null
          ? '계산 안 됨'
          : `${formatAmount(p.nativeBalance, native.decimals, 4)} ≥ ${formatAmount(p.maxFee, native.decimals, 4)}`,
    },
    { label: 'RPC 체인', ok: true, detail: String(p.network.chainId) },
  ];
  const passed = checks.filter((c) => c.ok).length;

  async function send() {
    if (!p) return;
    setBusy(true);
    setError(null);
    try {
      const signed = await withSigner((signer) => signTransfer(p, signer));
      // 전송 전에 기록한다: 응답을 잃어도 홈의 pending 재확인으로 추적된다
      saveTx({
        hash: signed.hash,
        networkId: p.network.id,
        symbol: p.token.symbol,
        decimals: p.token.decimals,
        fromAddress: p.from,
        toAddress: p.to,
        amount: p.amount.toString(),
        nonce: p.nonce,
        status: 'pending',
        createdAt: Date.now(),
      });
      const result = await broadcast(p.network, signed);
      if (result === 'rejected') {
        updateTxStatus(signed.hash, 'dropped');
        throw new WalletError('BroadcastFailed');
      }
      // 이 확인 화면의 거래일 때만 상태 화면으로 넘긴다
      if (useSendFlow.getState().preview !== p) {
        setBusy(false);
        return;
      }
      useSendFlow.getState().setSent(signed.hash, result === 'unknown');
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
            <Label size={13} color={colors.danger}>
              {error}
            </Label>
          )}
          <Button
            title="Face ID로 서명하고 보내기"
            icon={<FaceIdIcon size={20} color="#FFFFFF" />}
            busy={busy}
            disabled={!tokenOk || !gasOk}
            onPress={() => void send()}
          />
        </>
      }
    >
      {/* 서명·전송 중에는 뒤로 갈 수 없다 */}
      <Stack.Screen
        options={{ title: '서명 전 확인', headerBackVisible: !busy, gestureEnabled: !busy }}
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
          ['보냄', p.from],
          ['받음', p.to],
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
          {`검증 ${passed}/${checks.length}`}
        </Label>
        {checks.map((c) => (
          <View key={c.label} style={styles.between}>
            <View style={styles.check}>
              {c.ok ? (
                <CheckIcon size={16} color={colors.accent} strokeWidth={3} />
              ) : (
                <AlertIcon size={16} color={colors.danger} strokeWidth={2.4} />
              )}
              <Label size={13} color={c.ok ? colors.text : colors.danger}>
                {c.label}
              </Label>
            </View>
            {c.detail && (
              <Label mono muted size={12}>
                {c.detail}
              </Label>
            )}
          </View>
        ))}
      </Card>

      <Card style={{ gap: 8 }}>
        <View style={styles.between}>
          <Label bold muted size={12}>
            트랜잭션
          </Label>
          <Label muted size={12}>
            EIP-1559
          </Label>
        </View>
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
            v={p.maxPriorityFeePerGas === null ? '—' : `${formatGwei(p.maxPriorityFeePerGas)} gwei`}
          />
          <Raw
            k="예상 수수료"
            v={
              p.estimatedFee === null
                ? '—'
                : `≈ ${formatAmount(p.estimatedFee, native.decimals, 6)} ${native.symbol}`
            }
          />
          <Raw
            k="최대 수수료"
            v={
              p.maxFee === null
                ? '—'
                : `${formatAmount(p.maxFee, native.decimals, 6)} ${native.symbol}`
            }
          />
        </View>
      </Card>
    </Screen>
  );
}

function Raw({ k, v }: { k: string; v: string }) {
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

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  network: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  party: { flexDirection: 'row' },
  partyLabel: { width: 44, paddingTop: 2 },
  check: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  raw: { backgroundColor: colors.soft, borderRadius: 12, padding: 12, gap: 4 },
  rawRow: { flexDirection: 'row' },
});
