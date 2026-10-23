import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { formatAmount } from '@/core/amount';
import type { ReceiptResult } from '@/core/evm/send';
import { waitForTransfer } from '@/core/transfer';
import { HenryCoin } from '@/features/brand';
import { formatTime, openExplorer, shortAddress, shortHash } from '@/features/format';
import { useT } from '@/features/i18n';
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

export default function SendStatus() {
  const c = useColors();
  const t = useT();
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
      // 블록 탐색기는 '네트워크에 전송' 줄의 hash 링크로 연다(거래 상세에도 있다)
      footer={<Button title={t.status.home} onPress={home} />}
    >
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />

      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          {status === 'confirmed' ? (
            <CoinReveal />
          ) : (
            <View style={[styles.badge, { backgroundColor: `${tone}1A` }]}>
              {status === 'pending' ? (
                <ClockIcon size={34} color={tone} />
              ) : (
                <AlertIcon size={34} color={tone} />
              )}
            </View>
          )}
        </View>
        <Label bold size={22}>
          {t.status[status]}
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
          title={t.status.stepSigned}
          detail={`Face ID · nonce ${p.nonce}`}
          time={formatTime(sent.sentAt)}
        />
        <Step
          done
          title={t.status.stepBroadcast}
          detail={shortHash(sent.hash)}
          time={formatTime(sent.sentAt)}
          onPress={() => openExplorer(p.network, `tx/${sent.hash}`)}
        />
        <Step
          last
          done={status === 'confirmed'}
          failed={status === 'failed' || status === 'dropped'}
          title={t.status.stepIncluded}
          detail={
            status === 'pending'
              ? sent.uncertain
                ? t.status.uncertain
                : t.status.waiting
              : status === 'confirmed'
                ? t.status.succeeded
                : t.status.failedDetail
          }
          time={status === 'pending' ? t.status.wait : ''}
        />
      </Card>

      <Card style={{ gap: 8 }}>
        <Info k={t.status.network} v={p.network.name} />
        <Info
          k={t.status.estimatedFee}
          mono
          v={
            p.estimatedFee === null
              ? '—'
              : `≈ ${formatAmount(p.estimatedFee, native.decimals, 6)} ${native.symbol}`
          }
        />
        <Info
          k={t.status.actualFee}
          mono
          muted={fee === undefined}
          v={
            fee === undefined
              ? t.status.afterConfirm
              : `${formatAmount(fee, native.decimals, 6)} ${native.symbol}`
          }
        />
      </Card>
    </Screen>
  );
}

/** 보냈을 때만 나오는 헨리 코인. 뒤집히며 나타나고 고리가 퍼진다(동작 줄이기를 켜 두면 바로 보인다). */
function CoinReveal() {
  const styles = useThemed(makeStyles);
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (!active) return;
      if (reduce) {
        progress.setValue(1);
        return;
      }
      Animated.timing(progress, {
        toValue: 1,
        duration: 1100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    });
    return () => {
      active = false;
      progress.stopAnimation();
    };
  }, [progress]);

  const coin = {
    opacity: progress.interpolate({
      inputRange: [0, 0.25],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    }),
    transform: [
      { perspective: 600 },
      { rotateY: progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '720deg'] }) },
      { scale: progress.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.5, 1.1, 1] }) },
    ],
  };
  const ring = {
    opacity: progress.interpolate({ inputRange: [0, 0.65, 1], outputRange: [0, 0.9, 0] }),
    transform: [
      { scale: progress.interpolate({ inputRange: [0, 0.65, 1], outputRange: [0.6, 0.6, 1.5] }) },
    ],
  };
  return (
    <View style={styles.coinStage}>
      <View style={styles.glow} />
      <Animated.View style={[styles.ring, ring]} />
      <Animated.View style={coin}>
        <HenryCoin size={84} check />
      </Animated.View>
    </View>
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
    hero: { alignItems: 'center', gap: 10, paddingTop: 24, paddingBottom: 8 },
    heroIcon: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
    coinStage: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
    glow: {
      position: 'absolute',
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: 'rgba(242,165,22,0.14)',
    },
    ring: {
      position: 'absolute',
      width: 84,
      height: 84,
      borderRadius: 42,
      borderWidth: 2,
      borderColor: '#F2A516',
    },
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
  });
