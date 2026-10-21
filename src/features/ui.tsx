import type { ReactNode } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// D안(투명한 거래) 토큰. 밝은 테마 하나만 쓴다.
export const colors = {
  bg: '#F4F5F7',
  card: '#FFFFFF',
  soft: '#F7F8FA',
  text: '#0F1115',
  muted: '#5A606B',
  line: '#EEF0F2',
  border: '#E4E6EA',
  placeholder: '#B8BDC6',
  accent: '#2F5BEA',
  accentText: '#1E3FB0',
  accentSoft: '#EAF0FF',
  warn: '#8A4500',
  ok: '#1F8A5B',
  danger: '#B42318',
  polygon: '#7B3FE4',
  ethereum: '#627EEA',
};

export function networkColor(nativeSymbol: string): string {
  return nativeSymbol === 'POL' ? colors.polygon : colors.ethereum;
}

export const fonts = {
  mono: 'IBMPlexMono_500Medium',
  monoBold: 'IBMPlexMono_600SemiBold',
};

/** 이전 화면들과 맞추기 위한 별칭 */
export function useColors() {
  return colors;
}

/** footer는 스크롤과 별개로 화면 아래에 붙는다(주 버튼 자리). */
export function Screen({
  children,
  footer,
  onRefresh,
}: {
  children: ReactNode;
  footer?: ReactNode;
  /** 당겨서 새로고침 */
  onRefresh?: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    // 숫자 키패드에는 닫기 키가 없어 하단 버튼이 키보드에 가린다 → 키보드만큼 올린다
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      {/* 헤더가 반투명(iOS)이라 inset을 자동으로 맞춰 내용이 헤더 밑에 깔리지 않게 한다 */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.screen}
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
  return (
    <Text
      style={[
        {
          color: color ?? (muted ? colors.muted : colors.text),
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
  const fg = secondary ? colors.accentText : '#FFFFFF';
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
          backgroundColor: secondary ? colors.accentSoft : colors.accent,
          opacity: disabled ? 0.4 : pressed || busy ? 0.7 : 1,
        },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon}
          <Text style={{ color: fg, fontSize: 16, fontWeight: '600' }}>{title}</Text>
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
        { backgroundColor: filled ? colors.soft : 'transparent', opacity: pressed ? 0.6 : 1 },
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
  // JPYC 공식 GitHub 조직(github.com/jpycoin) 프로필 이미지
  JPYC: require('@/assets/tokens/jpyc.png'),
};

/** 로고가 없는 토큰은 점선 자리 표시. */
export function TokenIcon({ symbol, size = 36 }: { symbol: string; size?: number }) {
  const logo = TOKEN_LOGOS[symbol];
  const box = { width: size, height: size, borderRadius: size / 2 };
  if (logo) {
    return (
      <Image
        source={logo}
        accessibilityLabel={symbol}
        style={[box, symbol === 'POL' && { borderWidth: 1, borderColor: colors.line }]}
      />
    );
  }
  return (
    <View
      accessibilityLabel={symbol}
      style={[box, styles.tokenPlaceholder, { borderWidth: size > 24 ? 1.5 : 1 }]}
    >
      <Text style={{ color: colors.muted, fontSize: size * 0.38 }}>?</Text>
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
  const head = value.slice(0, 6);
  const tail = value.slice(-4);
  const middle = short ? '…' : value.slice(6, -4);
  return (
    <Text
      style={{ fontFamily: fonts.mono, fontSize: size, color: colors.text, lineHeight: size * 1.5 }}
    >
      <Text style={{ fontFamily: fonts.monoBold }}>{head}</Text>
      {middle}
      <Text style={{ fontFamily: fonts.monoBold }}>{tail}</Text>
    </Text>
  );
}

export function Divider() {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />;
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 14 },
  footer: { paddingHorizontal: 16, paddingTop: 12, gap: 10, backgroundColor: colors.bg },
  card: { backgroundColor: colors.card, borderRadius: 20, padding: 18, gap: 10 },
  button: {
    height: 56,
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
    borderColor: colors.placeholder,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
