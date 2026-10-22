import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatAmount } from '@/core/amount';
import type { ReceiptResult } from '@/core/evm/send';
import { waitForTransfer } from '@/core/transfer';
import { formatTime, openExplorer, shortAddress, shortHash } from '@/features/format';
import { AlertIcon, CheckIcon, ClockIcon } from '@/features/icons';
import { useSendFlow } from '@/features/send/store';
import {
  Button,
  Card,
  Label,
  type Palette,
  Screen,
  TokenIcon,
  useColors,
  useThemed,
} from '@/features/ui';

const HEADLINE = {
  pending: '블록 포함을 기다리는 중',
  confirmed: '보냈습니다',
  failed: '거래가 실패했습니다',
  dropped: '전송되지 않았습니다',
};

export default function SendStatus() {
  const c = useColors();
  const styles = useThemed(makeStyles);
  const p = useSendFlow((s) => s.preview);
  const sent = useSendFlow((s) => s.sent);
  const [result, setResult] = useState<ReceiptResult>({ status: 'pending' });

  useEffect(() => {
    if (!p || !sent) return;
    let active = true;
    waitForTransfer(p.network, sent.hash).then((r) => {
      if (active) setResult(r);
    });
    return () => {
      active = false;
    };
  }, [p, sent]);

  if (!p || !sent) return null;
  const native = p.network.native;
  const { status, fee } = result;
  const tone = status === 'confirmed' ? c.ok : status === 'pending' ? c.warn : c.danger;

  function home() {
    useSendFlow.getState().reset();
    router.dismissTo('/');
  }

  return (
    <Screen
      footer={
        <>
          <Pressable
            accessibilityRole="link"
            onPress={() => openExplorer(p.network, `tx/${sent.hash}`)}
            style={styles.explorer}
          >
            <Label bold>{`${p.network.explorerUrl.replace('https://', '')}에서 보기 ↗`}</Label>
          </Pressable>
          <Button title="홈으로" onPress={home} />
        </>
      }
    >
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />

      <View style={styles.hero}>
        <View style={[styles.badge, { backgroundColor: `${tone}1A` }]}>
          {status === 'confirmed' ? (
            <CheckIcon size={34} color={tone} strokeWidth={2.6} />
          ) : status === 'pending' ? (
            <ClockIcon size={34} color={tone} />
          ) : (
            <AlertIcon size={34} color={tone} />
          )}
        </View>
        <Label bold size={22}>
          {HEADLINE[status]}
        </Label>
        <View style={styles.row}>
          <TokenIcon symbol={p.token.symbol} size={22} />
          <Label mono bold size={17}>
            {`${formatAmount(p.amount, p.token.decimals)} ${p.token.symbol} → ${shortAddress(p.to)}`}
          </Label>
        </View>
      </View>

      <Card style={{ gap: 0 }}>
        <Step
          done
          title="기기에서 서명"
          detail={`Face ID · nonce ${p.nonce}`}
          time={formatTime(sent.sentAt)}
        />
        <Step
          done
          title="네트워크에 전송"
          detail={shortHash(sent.hash)}
          time={formatTime(sent.sentAt)}
          onPress={() => openExplorer(p.network, `tx/${sent.hash}`)}
        />
        <Step
          last
          done={status === 'confirmed'}
          failed={status === 'failed' || status === 'dropped'}
          title="블록에 포함"
          detail={
            status === 'pending'
              ? sent.uncertain
                ? '전송 응답을 받지 못했어요. 네트워크에 올라갔는지 이어서 확인합니다. 다시 보내기 전에 홈에서 상태를 확인하세요.'
                : '보통 몇 초 걸려요. 앱을 닫아도 다음에 열 때 이어서 확인합니다.'
              : status === 'confirmed'
                ? '성공했습니다 (status 1)'
                : '실패했습니다 (status 0) · 토큰은 나가지 않았고 수수료만 냈습니다'
          }
          time={status === 'pending' ? '대기' : ''}
        />
      </Card>

      <Card style={{ gap: 8 }}>
        <Info k="네트워크" v={p.network.name} />
        <Info
          k="예상 수수료"
          mono
          v={
            p.estimatedFee === null
              ? '—'
              : `≈ ${formatAmount(p.estimatedFee, native.decimals, 6)} ${native.symbol}`
          }
        />
        <Info
          k="실제 수수료"
          mono
          muted={fee === undefined}
          v={
            fee === undefined
              ? '확정 후 표시'
              : `${formatAmount(fee, native.decimals, 6)} ${native.symbol}`
          }
        />
      </Card>
    </Screen>
  );
}

function Info({ k, v, mono, muted }: { k: string; v: string; mono?: boolean; muted?: boolean }) {
  const styles = useThemed(makeStyles);
  return (
    <View style={styles.row}>
      <Label muted size={13} style={{ width: 96 }}>
        {k}
      </Label>
      <Label mono={mono} muted={muted} size={13}>
        {v}
      </Label>
    </View>
  );
}

function Step({
  title,
  detail,
  time,
  done,
  failed,
  last,
  onPress,
}: {
  title: string;
  detail: string;
  time: string;
  done?: boolean;
  failed?: boolean;
  last?: boolean;
  onPress?: () => void;
}) {
  const c = useColors();
  const styles = useThemed(makeStyles);
  const color = failed ? c.danger : done ? c.ok : c.warn;
  return (
    <View style={styles.step}>
      <View style={styles.rail}>
        <View
          style={[
            styles.node,
            done || failed
              ? { backgroundColor: color }
              : { borderWidth: 2.5, borderColor: color, backgroundColor: c.card },
          ]}
        >
          {done && <CheckIcon size={12} color="#FFFFFF" strokeWidth={3.5} />}
        </View>
        {!last && <View style={[styles.line, { backgroundColor: done ? c.ok : c.border }]} />}
      </View>
      <View style={{ flex: 1, gap: 2, paddingBottom: last ? 0 : 14 }}>
        <Label bold color={done ? c.text : color}>
          {title}
        </Label>
        {onPress ? (
          <Pressable accessibilityRole="link" onPress={onPress} hitSlop={8}>
            <Label mono size={12} color={c.accent}>{`${detail} ↗`}</Label>
          </Pressable>
        ) : (
          <Label muted size={12}>
            {detail}
          </Label>
        )}
      </View>
      <Label mono muted size={12}>
        {time}
      </Label>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    hero: { alignItems: 'center', gap: 10, paddingTop: 40, paddingBottom: 8 },
    badge: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    step: { flexDirection: 'row', gap: 12 },
    rail: { alignItems: 'center', width: 20 },
    node: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    line: { flex: 1, width: 2, minHeight: 20 },
    explorer: {
      height: 52,
      borderRadius: 16,
      backgroundColor: c.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
