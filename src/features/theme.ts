import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

// D안(투명한 거래) 토큰. 시스템 설정을 따라 밝은/어두운 테마를 쓴다.
// primary는 흰 글자를 얹는 채움색, accent는 어두운/밝은 바탕 위의 링크·아이콘색이다.
const light = {
  bg: '#F4F5F7',
  card: '#FFFFFF',
  soft: '#F7F8FA',
  segment: '#E9EBEF',
  // 세그먼트(탭 묶음) 안에서 고른 칸
  segmentOn: '#FFFFFF',
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
  segment: '#1A1F29',
  segmentOn: '#2C3340',
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
