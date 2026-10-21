import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { parseAddressQr } from '@/core/address';
import { CrossIcon } from '@/features/icons';
import { useNetwork } from '@/features/network-store';
import { Button, Label } from '@/features/ui';

/**
 * 주소 QR을 읽어 보내기 화면의 받는 주소로 넘긴다.
 * from=home이면 보내기 화면을 새로 열고, 아니면 열려 있던 보내기 화면으로 돌아간다.
 */
export default function Scan() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const network = useNetwork((s) => s.network);
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [message, setMessage] = useState<string | null>(null);
  // 같은 QR이 연달아 여러 번 인식되므로 한 번만 처리한다
  const handled = useRef(false);

  // 처음 열면 바로 권한을 묻는다(거절한 적이 있으면 설정 안내 버튼만 보인다)
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) void requestPermission();
  }, [permission, requestPermission]);

  function onScanned({ data }: BarcodeScanningResult) {
    if (handled.current) return;
    const parsed = parseAddressQr(data);
    if (!parsed) {
      setMessage('지갑 주소 QR이 아닙니다.');
      return;
    }
    if (parsed.chainId !== undefined && parsed.chainId !== network.chainId) {
      setMessage(
        `다른 네트워크(chainId ${parsed.chainId})용 QR입니다. 지금은 ${network.name}입니다.`,
      );
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
            주소 QR을 읽으려면 카메라 권한이 필요합니다.
          </Label>
          {permission && !permission.canAskAgain ? (
            <Button title="설정에서 허용" onPress={() => void Linking.openSettings()} />
          ) : (
            <Button title="카메라 허용" onPress={() => void requestPermission()} />
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
          accessibilityLabel="닫기"
          onPress={() => router.back()}
          style={styles.close}
        >
          <CrossIcon size={20} color="#FFFFFF" strokeWidth={2.4} />
        </Pressable>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
        <Label bold color="#FFFFFF" style={{ textAlign: 'center' }}>
          받는 사람의 주소 QR을 비춰 주세요
        </Label>
        <Label size={13} color={message ? '#FFB4A9' : '#C9CCD3'} style={{ textAlign: 'center' }}>
          {message ?? `${network.name} 주소만 받습니다`}
        </Label>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
