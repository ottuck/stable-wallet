import { getBytes } from 'ethers';
import { Linking } from 'react-native';

import type * as Real from '@/platform/services';

import { DEMO } from '../data';
import { mode } from '../mode';
import { setFaceId, showNotice } from '../notice';
import { sleep } from '../sleep';
import { createFakeNode } from './fake-node';

// src/platform/services.ts 대신. 기기 기능은 메모리로 흉내 내고, 공개 웹 데모가 실제 돈과 닿지 않게 막는다.
// 지갑 규칙(문구 검증, 주소 파생, 거래 순서·저장, 수수료 계산, 서명)은 실제 core 코드가 그대로 돈다.
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

const keychain = new Map<string, string>();

/**
 * 가짜 보안 저장소. 키는 이 페이지의 메모리에만 있다. Face ID가 필요한 읽기에서는 확인 장면을 보여준다.
 * ?state=error면 실제 앱에서 Keychain을 읽지 못했을 때처럼 읽기가 실패한다.
 */
export const secureStore: typeof Real.secureStore = {
  async get(key, auth) {
    if (mode === 'error') throw new Error('demo: secure store unavailable');
    if (auth) {
      setFaceId(true);
      try {
        await sleep(DEMO.latency.sign);
      } finally {
        setFaceId(false);
      }
    }
    return keychain.get(key) ?? null;
  },
  async set(key, value) {
    keychain.set(key, value);
  },
  async remove(key) {
    keychain.delete(key);
  },
  canUseBiometrics: () => true,
};

/** 공개 데모에서 진짜로 쓸 수 있는 복구 문구를 만들지 않도록 "난수"는 늘 예시 문구의 entropy다 */
export const randomBytes: typeof Real.randomBytes = (length) => {
  const entropy = getBytes(DEMO.entropy);
  if (length > entropy.length) throw new Error(`demo: randomBytes(${length})`);
  return entropy.slice(0, length);
};

/** 공개 RPC 대신 메모리에서 잔액·nonce·확정을 계산하는 가짜 노드 */
export const createRpcProvider: typeof Real.createRpcProvider = createFakeNode;

/** 방문자의 실제 클립보드는 읽지 않는다. 붙여넣기는 예시 받는 주소다 */
export const readClipboard: typeof Real.readClipboard = async () => DEMO.recipient;

/** 데모 주소가 밖으로 나가지 않게 복사는 안내만 띄운다 */
export const writeClipboard: typeof Real.writeClipboard = async () => {
  showNotice('notCopied');
  return true;
};

/** 데모 주소를 남에게 보내면 그 주소로 실제 돈이 올 수 있어 공유는 안내만 띄운다 */
export const shareText: typeof Real.shareText = async () => {
  showNotice('notShared');
};

/** 데모 거래의 hash는 가짜라 탐색기에 없으므로 안내만 띄운다. 토큰 컨트랙트 등은 실제 주소라 그대로 연다 */
export const openUrl: typeof Real.openUrl = async (url) => {
  if (url.includes('/tx/')) showNotice('noExplorer');
  else await Linking.openURL(url);
};

/** 데모 카메라는 늘 허용이라 설정 화면으로 갈 일이 없다 */
export const openSettings: typeof Real.openSettings = async () => {};
