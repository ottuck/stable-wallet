import { Share, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { tokensOn } from '@/core/config/tokens';
import { CopyButton } from '@/features/copy-button';
import { AlertIcon, ShareIcon } from '@/features/icons';
import { useNetwork } from '@/features/network-store';
import { Address, Card, colors, IconButton, Label, Screen, TokenIcon } from '@/features/ui';
import { useWallet } from '@/features/wallet/store';

export default function Receive() {
  const address = useWallet((s) => s.address)!;
  const network = useNetwork((s) => s.network);
  const assets = [network.native.symbol, ...tokensOn(network.id).map((t) => t.symbol)];

  return (
    <Screen>
      <View style={styles.warning}>
        <AlertIcon size={18} color={colors.warn} />
        <Label size={13} color="#5C2E00" style={{ flex: 1, lineHeight: 20 }}>
          <Label bold size={13} color="#5C2E00">
            {network.name}
          </Label>
          로 보내 달라고 하세요. 다른 네트워크로 보내면 이 앱에서 보이지 않고 되찾기 어렵습니다.
        </Label>
      </View>

      <Card style={styles.qrCard}>
        {/* 주소만 담는다(EIP-681 결제 URI는 나중에). MetaMask·거래소 앱이 그대로 읽는다 */}
        <View accessibilityLabel="내 지갑 주소 QR 코드" style={styles.qr}>
          <QRCode
            value={address}
            size={220}
            color={colors.text}
            backgroundColor={colors.card}
            ecl="M"
          />
        </View>
        <View style={styles.addressRow}>
          <View style={{ flex: 1 }}>
            <Address value={address} />
          </View>
          <View style={{ gap: 4 }}>
            <CopyButton value={address} filled color={colors.text} />
            <IconButton
              label="주소 공유"
              filled
              onPress={() => void Share.share({ message: address })}
            >
              <ShareIcon size={18} />
            </IconButton>
          </View>
        </View>
      </Card>

      <Card>
        <Label bold muted size={12}>
          이 주소로 받을 수 있는 것
        </Label>
        <View style={styles.assets}>
          {assets.map((symbol) => (
            <View key={symbol} style={styles.asset}>
              <TokenIcon symbol={symbol} size={22} />
              <Label size={14}>{symbol}</Label>
            </View>
          ))}
        </View>
        {(network.id === 'polygon' || network.id === 'avalanche') && (
          <Label muted size={12} style={{ lineHeight: 18 }}>
            브릿지된 USDC.e는 이 앱에서 지원하지 않습니다. 보내는 쪽에서 USDC(native)인지
            확인하세요.
          </Label>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  warning: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FFF3E5',
    borderRadius: 16,
    padding: 14,
  },
  qrCard: { alignItems: 'center', paddingVertical: 24, gap: 18 },
  qr: { padding: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'stretch' },
  assets: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  asset: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
