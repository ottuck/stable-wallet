import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { parseAddressQr } from '@/core/address';
import { CrossIcon } from '@/features/icons';
import { useT } from '@/features/i18n';
import { useNetwork } from '@/features/network-store';
import { Button, Label, type Palette, useThemed } from '@/features/ui';

/**
 * 주소 QR을 읽어 보내기 화면의 받는 주소로 넘긴다.
 * from=home이면 보내기 화면을 새로 열고, 아니면 열려 있던 보내기 화면으로 돌아간다.
 */
export default function Scan() {
  const t = useT();
  const styles = useThemed(makeStyles);
  const { from } = useLocalSearchParams<{ from?: string }>();
  const network = useNetwork((s) => s.network);
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [message, setMessage] = useState<string | null>(null);
  // 같은 QR이 연달아 여러 번 인식되므로 한 번만 처리한다
  const handled = useRef(false);

  // 처음 열면 바로 권한을 묻는다(거절한 적이 있으면 설정 안내 버튼만 보인다)
  // 한 번만 묻는다(Android는 거절 뒤에도 canAskAgain이 true라 매번 다시 물을 수 있다)
  const asked = useRef(false);
  useEffect(() => {
    if (asked.current || !permission || permission.granted || !permission.canAskAgain) return;
    asked.current = true;
    void requestPermission();
  }, [permission, requestPermission]);

  function onScanned({ data }: BarcodeScanningResult) {
    if (handled.current) return;
    const parsed = parseAddressQr(data);
    if (!parsed) {
      setMessage(t.scan.notAddress);
      return;
    }
    if (parsed.chainId !== undefined && parsed.chainId !== network.chainId) {
      setMessage(t.scan.otherNetwork(parsed.chainId, network.name));
      return;
    }
    handled.current = true;
    const target = {
      pathname: '/send' as const,
      params: { to: parsed.address, t: String(Date.now()) },
    };
    if (from === 'home') router.replace(target);
    else router.dismissTo(target);
  }

  return (
    <View style={styles.root}>
      {permission?.granted ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={onScanned}
        />
      ) : (
        <View style={[styles.center, { padding: 32, gap: 16 }]}>
          <Label color="#FFFFFF" style={{ textAlign: 'center', lineHeight: 22 }}>
            {t.scan.needCamera}
          </Label>
          {permission && !permission.canAskAgain ? (
            <Button title={t.scan.openSettings} onPress={() => void Linking.openSettings()} />
          ) : (
            <Button title={t.scan.allowCamera} onPress={() => void requestPermission()} />
          )}
        </View>
      )}

      {permission?.granted && (
        <View pointerEvents="none" style={styles.center}>
          <View style={styles.frame} />
        </View>
      )}

      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.common.close}
          onPress={() => router.back()}
          style={styles.close}
        >
          <CrossIcon size={20} color="#FFFFFF" strokeWidth={2.4} />
        </Pressable>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
        <Label bold color="#FFFFFF" style={{ textAlign: 'center' }}>
          {t.scan.aim}
        </Label>
        <Label size={13} color={message ? '#FFB4A9' : '#C9CCD3'} style={{ textAlign: 'center' }}>
          {message ?? t.scan.onlyAddresses(network.name)}
        </Label>
      </View>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000000' },
    center: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    frame: {
      width: 240,
      height: 240,
      borderRadius: 24,
      borderWidth: 3,
      borderColor: '#FFFFFF',
    },
    top: { position: 'absolute', left: 16, right: 16, top: 0 },
    close: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    bottom: { position: 'absolute', left: 24, right: 24, bottom: 0, gap: 6 },
  });
