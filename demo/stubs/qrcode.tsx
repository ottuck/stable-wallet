import { Text, View } from 'react-native';
import RealQRCode from 'react-native-qrcode-svg';

import { DEMO } from '../data';
import { useDemoText } from '../text';

type Props = React.ComponentProps<typeof RealQRCode>;

// react-native-qrcode-svg 대신. 공개 페이지의 주소 QR을 누가 실제 지갑으로 찍어 돈을 보내지 않도록
// 주소가 아닌 안내 글을 담고, 가운데를 크게 덮어 일부러 읽히지 않게 한다.
export default function DemoQRCode({ size = 100, ...props }: Props) {
  const d = useDemoText();
  const badge = size * 0.5;
  return (
    <View style={{ width: size, height: size }}>
      <RealQRCode {...props} size={size} value={DEMO.qrText} ecl="L" />
      <View
        style={{
          position: 'absolute',
          left: (size - badge) / 2,
          top: (size - badge) / 2,
          width: badge,
          height: badge,
          borderRadius: 18,
          backgroundColor: '#FFFFFF',
          borderWidth: 3,
          borderColor: '#0F1115',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <Text style={{ fontSize: badge * 0.24, fontWeight: '800', color: '#0F1115' }}>
          {d.qrBadge}
        </Text>
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#B42318' }}>{d.qrNote}</Text>
      </View>
    </View>
  );
}
