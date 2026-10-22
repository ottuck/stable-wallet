import RealQRCode from 'react-native-qrcode-svg';

import { DEMO } from '../data';

type Props = React.ComponentProps<typeof RealQRCode>;

// react-native-qrcode-svg 대신. 공개 페이지의 QR을 누가 실제 지갑으로 찍어 돈을 보내지 않도록
// 주소 대신 안내 글을 담는다. 모양은 진짜 QR과 같고, 찍어도 어느 지갑도 송금 주소로 받지 않는다.
export default function DemoQRCode(props: Props) {
  return <RealQRCode {...props} value={DEMO.qrText} />;
}
