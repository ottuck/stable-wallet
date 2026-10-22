import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/** Henry Wallet 마크. 앱 아이콘(assets/images/icon.png)과 같은 모양이다. */
export function HenryMark({ size = 96 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024" accessibilityLabel="Henry Wallet">
      <Defs>
        <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#4F80FF" />
          <Stop offset="1" stopColor="#1A37A3" />
        </LinearGradient>
        <LinearGradient id="h" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#D6E1FF" />
        </LinearGradient>
        <LinearGradient id="coin" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFE9A0" />
          <Stop offset="1" stopColor="#F2A516" />
        </LinearGradient>
      </Defs>
      <Rect width={1024} height={1024} rx={230} fill="url(#bg)" />
      <Rect x={288} y={296} width={136} height={432} rx={48} fill="url(#h)" />
      <Rect x={600} y={296} width={136} height={432} rx={48} fill="url(#h)" />
      <Rect x={400} y={476} width={224} height={72} fill="url(#h)" />
      <Circle cx={512} cy={512} r={78} fill="url(#coin)" />
      <Circle
        cx={512}
        cy={512}
        r={55}
        fill="none"
        stroke="#9A5A00"
        strokeOpacity={0.32}
        strokeWidth={9}
      />
    </Svg>
  );
}
