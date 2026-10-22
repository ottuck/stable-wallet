import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

/**
 * 앱 아이콘의 코인. 같은 그라데이션과 안쪽 고리에 은은한 하이라이트를 더했다.
 * check면 가운데에 체크를, shadow면 아래에 부드러운 그림자를 그린다(그만큼 세로로 길어진다).
 */
export function HenryCoin({
  size = 64,
  check,
  shadow,
}: {
  size?: number;
  check?: boolean;
  shadow?: boolean;
}) {
  const height = shadow ? 196 : 172;
  return (
    <Svg width={size} height={(size * height) / 172} viewBox={`0 0 172 ${height}`}>
      <Defs>
        <LinearGradient id="henryCoinFace" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFE9A0" />
          <Stop offset="1" stopColor="#F2A516" />
        </LinearGradient>
        <RadialGradient id="henryCoinShadow" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0" stopColor="#9A5A00" stopOpacity={0.3} />
          <Stop offset="1" stopColor="#9A5A00" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      {shadow && <Ellipse cx={86} cy={180} rx={52} ry={8} fill="url(#henryCoinShadow)" />}
      <Circle cx={86} cy={86} r={78} fill="url(#henryCoinFace)" />
      <Path
        d="M28 72A62 62 0 0 1 98 24"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity={0.4}
        strokeWidth={6}
        strokeLinecap="round"
      />
      <Circle
        cx={86}
        cy={86}
        r={55}
        fill="none"
        stroke="#9A5A00"
        strokeOpacity={0.32}
        strokeWidth={9}
      />
      {check && (
        <Path
          d="M62 88l17 17 31-35"
          fill="none"
          stroke="#9A5A00"
          strokeOpacity={0.6}
          strokeWidth={13}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </Svg>
  );
}

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
