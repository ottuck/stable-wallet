import type { HDNodeWallet } from 'ethers';

import { secureStore } from '../../platform/services';
import { WalletError } from '../errors';
import { deriveWallet, isValidMnemonic, normalizeMnemonic } from './mnemonic';

// 복구 문구는 이 파일만 읽고 쓴다(docs/PROJECT.md 보안 모델).
const MNEMONIC_KEY = 'wallet.mnemonic';
const ADDRESS_KEY = 'wallet.address';

// 복구 문구는 읽을 때마다 Face ID를 거친다. 주소는 공개 정보라 인증 없이 읽는다.
// 둘 다 앱을 지워도 Keychain에 남아 재설치 때 지갑을 찾는 데 쓴다.
const SECRET = true;
const PUBLIC = false;

export function loadAddress(): Promise<string | null> {
  return secureStore.get(ADDRESS_KEY, PUBLIC);
}

/** 복구 문구를 저장하고 주소를 돌려준다. 이미 지갑이 있으면 덮어쓰지 않는다. */
export async function saveWallet(input: string): Promise<string> {
  const phrase = normalizeMnemonic(input);
  if (!isValidMnemonic(phrase)) throw new WalletError('InvalidMnemonic');
  if (await loadAddress()) throw new WalletError('WalletExists');
  if (!secureStore.canUseBiometrics()) throw new WalletError('BiometricsUnavailable');

  const { address } = deriveWallet(phrase);
  await secureStore.set(MNEMONIC_KEY, phrase, SECRET);
  await secureStore.set(ADDRESS_KEY, address, PUBLIC);
  return address;
}

/** Face ID로 복구 문구를 읽어 서명 키를 만들고 fn에만 넘긴다. 키는 저장하지 않는다. */
export async function withSigner<T>(fn: (signer: HDNodeWallet) => Promise<T>): Promise<T> {
  let phrase: string | null;
  try {
    phrase = await secureStore.get(MNEMONIC_KEY, SECRET);
  } catch (cause) {
    throw new WalletError('AuthCancelled', { cause });
  }
  if (!phrase) throw new WalletError('WalletNotFound');
  return fn(deriveWallet(phrase));
}

export async function deleteWallet(): Promise<void> {
  await secureStore.remove(MNEMONIC_KEY, SECRET);
  await secureStore.remove(ADDRESS_KEY, PUBLIC);
}
