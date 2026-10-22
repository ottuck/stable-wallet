import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { useColors } from './ui';

type IconProps = { size?: number; color?: string; strokeWidth?: number };

function icon(render: () => React.ReactNode) {
  return function Icon({ size = 20, color, strokeWidth = 2 }: IconProps) {
    const c = useColors();
    return (
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color ?? c.text}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {render()}
      </Svg>
    );
  };
}

export const CopyIcon = icon(() => (
  <>
    <Rect x={9} y={9} width={11} height={11} rx={2} />
    <Path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </>
));
export const ShareIcon = icon(() => (
  <>
    <Path d="M12 15V3M8 7l4-4 4 4" />
    <Path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
  </>
));
export const SendIcon = icon(() => <Path d="M7 17L17 7M8 7h9v9" />);
export const ReceiveIcon = icon(() => <Path d="M17 7L7 17M16 17H7V8" />);
export const ScanIcon = icon(() => (
  <Path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16" />
));
export const CheckIcon = icon(() => <Path d="M5 12l5 5 9-10" />);
export const CrossIcon = icon(() => <Path d="M6 6l12 12M18 6L6 18" />);
export const ClockIcon = icon(() => (
  <>
    <Circle cx={12} cy={12} r={9} />
    <Path d="M12 7v5l3 2" />
  </>
));
export const AlertIcon = icon(() => (
  <>
    <Circle cx={12} cy={12} r={9} />
    <Path d="M12 8v5M12 16v.5" />
  </>
));
export const ChevronDownIcon = icon(() => <Path d="M6 9l6 6 6-6" />);
export const ChevronLeftIcon = icon(() => <Path d="M15 6l-6 6 6 6" />);
export const CameraIcon = icon(() => (
  <>
    <Path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
    <Circle cx={12} cy={13} r={3.5} />
  </>
));
export const BackspaceIcon = icon(() => (
  <>
    <Path d="M9 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6-7 6-7z" />
    <Path d="M13 10l4 4M17 10l-4 4" />
  </>
));
export const FaceIdIcon = icon(() => (
  <>
    <Path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
    <Path d="M9 10v1M15 10v1M12 10v3h-1M9.5 15.5a3.5 3.5 0 0 0 5 0" />
  </>
));
export const ShieldIcon = icon(() => (
  <>
    <Path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
    <Path d="M9 12l2.2 2.2L15.5 10" />
  </>
));
export const EyeIcon = icon(() => (
  <>
    <Path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <Circle cx={12} cy={12} r={3} />
  </>
));
export const KeyIcon = icon(() => (
  <>
    <Circle cx={8} cy={15} r={4} />
    <Path d="M11 12l9-9M16 7l3 3M14 9l2 2" />
  </>
));
