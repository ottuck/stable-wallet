import { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type ViewStyle,
} from 'react-native';

import { useSafeAreaInsets } from '@/platform/ui';

import { fonts, useColors, useThemed, type Palette } from './theme';

// 색·글꼴 토큰은 theme.ts에 있다(데모 가짜 부품도 쓰므로 화면 부품과 나눈다)
export * from './theme';

/** 글자 크기를 키운 사용자에게도 레이아웃이 깨지지 않게 상한을 둔다. */
export const MAX_FONT_SCALE = 1.3;

/** footer는 스크롤과 별개로 화면 아래에 붙는다(주 버튼 자리). */
export function Screen({
  children,
  footer,
  onRefresh,
  fill,
}: {
  children: ReactNode;
  footer?: ReactNode;
  /** 당겨서 새로고침 */
  onRefresh?: () => void;
  /** 남는 세로 공간을 flex: 1인 자식이 채우게 한다(내용이 길면 평소처럼 스크롤) */
  fill?: boolean;
}) {
  const c = useColors();
  const styles = useThemed(makeStyles);
  const insets = useSafeAreaInsets();
  return (
    // 숫자 키패드에는 닫기 키가 없어 하단 버튼이 키보드에 가린다 → 키보드만큼 올린다
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: c.bg }}
    >
      {/* 헤더가 반투명(iOS)이라 inset을 자동으로 맞춰 내용이 헤더 밑에 깔리지 않게 한다 */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={fill ? [styles.screen, { flexGrow: 1 }] : styles.screen}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          onRefresh ? <RefreshControl refreshing={false} onRefresh={onRefresh} /> : undefined
        }
      >
        {children}
      </ScrollView>
      {footer && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {footer}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const styles = useThemed(makeStyles);
  return <View style={[styles.card, style]}>{children}</View>;
}

type LabelProps = TextProps & {
  muted?: boolean;
  mono?: boolean;
  bold?: boolean;
  size?: number;
  color?: string;
};

export function Label({ muted, mono, bold, size, color, style, ...props }: LabelProps) {
  const c = useColors();
  return (
    <Text
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      style={[
        {
          color: color ?? (muted ? c.muted : c.text),
          fontSize: size ?? (mono ? 14 : 15),
          fontWeight: bold ? '700' : '400',
        },
        mono && { fontFamily: bold ? fonts.monoBold : fonts.mono, fontWeight: undefined },
        style,
      ]}
      {...props}
    />
  );
}

export function Button({
  title,
  onPress,
  busy,
  disabled,
  secondary,
  icon,
}: {
  title: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  secondary?: boolean;
  icon?: ReactNode;
}) {
  const c = useColors();
  const styles = useThemed(makeStyles);
  const fg = secondary ? c.accentText : c.onPrimary;
  const inactive = busy || disabled;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: secondary ? c.accentSoft : c.primary,
          opacity: disabled ? 0.4 : pressed || busy ? 0.7 : 1,
        },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon}
          <Text
            maxFontSizeMultiplier={MAX_FONT_SCALE}
            style={{ color: fg, fontSize: 16, fontWeight: '600' }}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({
  label,
  onPress,
  children,
  filled,
  disabled,
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
  filled?: boolean;
  disabled?: boolean;
}) {
  const c = useColors();
  const styles = useThemed(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: filled ? c.soft : 'transparent', opacity: pressed ? 0.6 : 1 },
      ]}
    >
      {children}
    </Pressable>
  );
}

const TOKEN_LOGOS: Record<string, number> = {
  USDC: require('@/assets/tokens/usdc.png'),
  POL: require('@/assets/tokens/pol.png'),
  ETH: require('@/assets/tokens/eth.png'),
  AVAX: require('@/assets/tokens/avax.png'),
  // JPYC 공식 GitHub 조직(github.com/jpycoin) 프로필 이미지
  JPYC: require('@/assets/tokens/jpyc.png'),
};

/** 로고가 없는 토큰은 점선 자리 표시. */
export function TokenIcon({ symbol, size = 36 }: { symbol: string; size?: number }) {
  const c = useColors();
  const styles = useThemed(makeStyles);
  const logo = TOKEN_LOGOS[symbol];
  const box = { width: size, height: size, borderRadius: size / 2 };
  if (logo) {
    return (
      <Image
        source={logo}
        accessibilityLabel={symbol}
        style={[box, symbol === 'POL' && { borderWidth: 1, borderColor: c.line }]}
      />
    );
  }
  return (
    <View
      accessibilityLabel={symbol}
      style={[box, styles.tokenPlaceholder, { borderWidth: size > 24 ? 1.5 : 1 }]}
    >
      <Text style={{ color: c.muted, fontSize: size * 0.38 }}>?</Text>
    </View>
  );
}

/** 앞뒤 네 글자를 굵게. 사용자가 받는 쪽과 맞춰 보는 부분이다. */
export function Address({
  value,
  short,
  size = 14,
}: {
  value: string;
  short?: boolean;
  size?: number;
}) {
  const c = useColors();
  const head = value.slice(0, 6);
  const tail = value.slice(-4);
  const middle = short ? '…' : value.slice(6, -4);
  return (
    <Text
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      style={{ fontFamily: fonts.mono, fontSize: size, color: c.text, lineHeight: size * 1.5 }}
    >
      <Text style={{ fontFamily: fonts.monoBold }}>{head}</Text>
      {middle}
      <Text style={{ fontFamily: fonts.monoBold }}>{tail}</Text>
    </Text>
  );
}

export function Divider() {
  const c = useColors();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.border }} />;
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    screen: { padding: 16, gap: 14 },
    footer: { paddingHorizontal: 16, paddingTop: 12, gap: 10, backgroundColor: c.bg },
    card: { backgroundColor: c.card, borderRadius: 20, padding: 18, gap: 10 },
    button: {
      minHeight: 56,
      paddingVertical: 8,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 10,
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tokenPlaceholder: {
      borderStyle: 'dashed',
      borderColor: c.placeholder,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
