import { useMemo, type ReactNode } from 'react';
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
  useColorScheme,
  View,
  type StyleProp,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// D안(투명한 거래) 토큰. 시스템 설정을 따라 밝은/어두운 테마를 쓴다.
// primary는 흰 글자를 얹는 채움색, accent는 어두운/밝은 바탕 위의 링크·아이콘색이다.
const light = {
  bg: '#F4F5F7',
  card: '#FFFFFF',
  soft: '#F7F8FA',
  segment: '#E9EBEF',
  text: '#0F1115',
  muted: '#5A606B',
  line: '#EEF0F2',
  border: '#E4E6EA',
  placeholder: '#B8BDC6',
  primary: '#2F5BEA',
  onPrimary: '#FFFFFF',
  accent: '#2F5BEA',
  accentText: '#1E3FB0',
  accentSoft: '#EAF0FF',
  warn: '#8A4500',
  warnText: '#5C2E00',
  warnSoft: '#FFF3E5',
  ok: '#1F8A5B',
  okSoft: '#E4F5EC',
  danger: '#B42318',
  dangerSoft: '#FDECEA',
};

const dark: typeof light = {
  bg: '#0B0D12',
  card: '#151922',
  soft: '#1C212B',
  segment: '#10131A',
  text: '#F2F4F7',
  muted: '#9AA1AD',
  line: '#222833',
  border: '#2B323E',
  placeholder: '#5B6270',
  primary: '#3F66E8',
  onPrimary: '#FFFFFF',
  accent: '#7C9DFF',
  accentText: '#A9C0FF',
  accentSoft: '#1B2748',
  warn: '#F5A64A',
  warnText: '#FFD9A8',
  warnSoft: '#2E2112',
  ok: '#3CC68A',
  okSoft: '#10281F',
  danger: '#FF7A6B',
  dangerSoft: '#33171A',
};

export type Palette = typeof light;

const networkColors = { polygon: '#7B3FE4', ethereum: '#627EEA', avalanche: '#E84142' };

export function networkColor(nativeSymbol: string): string {
  if (nativeSymbol === 'POL') return networkColors.polygon;
  if (nativeSymbol === 'AVAX') return networkColors.avalanche;
  return networkColors.ethereum;
}

export const fonts = {
  mono: 'IBMPlexMono_500Medium',
  monoBold: 'IBMPlexMono_600SemiBold',
};

export function useColors(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}

/** 테마가 바뀔 때만 스타일을 다시 만든다. make는 모듈 최상위 함수로 둔다. */
export function useThemed<T>(make: (c: Palette) => T): T {
  const c = useColors();
  return useMemo(() => make(c), [make, c]);
}

/** 글자 크기를 키운 사용자에게도 레이아웃이 깨지지 않게 상한을 둔다. */
export const MAX_FONT_SCALE = 1.3;

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
