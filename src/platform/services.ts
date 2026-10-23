// 앱이 기기·바깥과 닿는 서비스 쪽 경계: 보안 저장소, 난수, RPC, 거래·설정 저장소, 클립보드, 공유, 링크.
// React를 모르므로 core도 쓴다. 앱 코드는 이 기능들을 여기서만 꺼내 쓴다(eslint가 직접 import를 막는다).
// 웹 데모는 이 파일을 demo/platform/services.ts로 통째로 바꾼다(demo/overrides.js).
import * as Clipboard from 'expo-clipboard';
import * as SecureStore from 'expo-secure-store';
import { JsonRpcProvider, Network, randomBytes as cryptoRandomBytes } from 'ethers';
import { Linking, Share } from 'react-native';

import type { NetworkConfig } from '@/core/config/networks';

export {
  getMeta,
  getTx,
  hasSentTo,
  isInstalled,
  listPendingTxs,
  listTxs,
  markInstalled,
  saveTx,
  setMeta,
  updateTxStatus,
} from './store';

/**
 * 기기 보안 저장소(iOS Keychain). 이 기기에서 잠금이 풀렸을 때만 읽히고 백업으로 옮겨지지 않는다.
 * auth면 읽을 때마다 Face ID를 거친다. 복구 문구가 지나가므로 core/keys만 쓴다(eslint).
 */
export const secureStore = {
  get: (key: string, auth: boolean): Promise<string | null> =>
    SecureStore.getItemAsync(key, storeOptions(auth)),
  set: (key: string, value: string, auth: boolean): Promise<void> =>
    SecureStore.setItemAsync(key, value, storeOptions(auth)),
  remove: (key: string, auth: boolean): Promise<void> =>
    SecureStore.deleteItemAsync(key, storeOptions(auth)),
  canUseBiometrics: (): boolean => SecureStore.canUseBiometricAuthentication(),
};

function storeOptions(auth: boolean): SecureStore.SecureStoreOptions {
  const keychainAccessible = SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY;
  return auth
    ? { keychainAccessible, requireAuthentication: true, authenticationPrompt: '지갑 잠금 해제' }
    : { keychainAccessible };
}

/** 암호학적 난수(react-native-get-random-values의 crypto.getRandomValues). 복구 문구 entropy에 쓴다. */
export function randomBytes(length: number): Uint8Array {
  return cryptoRandomBytes(length);
}

/** 네트워크(RPC) 연결 하나. 네트워크마다 하나만 쓰도록 core/evm/provider가 캐시한다. */
export function createRpcProvider(network: NetworkConfig): JsonRpcProvider {
  // chainId를 고정해 매 요청마다 eth_chainId를 부르지 않는다. 서명 전에는 따로 확인한다.
  return new JsonRpcProvider(network.rpcUrl, network.chainId, {
    staticNetwork: Network.from(network.chainId),
  });
}

export function readClipboard(): Promise<string> {
  return Clipboard.getStringAsync();
}

export function writeClipboard(text: string): Promise<boolean> {
  return Clipboard.setStringAsync(text);
}

/** 시스템 공유 시트 */
export function shareText(message: string): Promise<unknown> {
  return Share.share({ message });
}

/** 브라우저로 주소를 연다(블록 탐색기) */
export function openUrl(url: string): Promise<void> {
  return Linking.openURL(url);
}

/** 이 앱의 시스템 설정 화면(카메라 권한을 다시 켤 때) */
export function openSettings(): Promise<void> {
  return Linking.openSettings();
}
