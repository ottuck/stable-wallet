import * as SecureStore from 'expo-secure-store';
import type { HDNodeWallet } from 'ethers';

import { WalletError } from '../errors';
import { deriveWallet, isValidMnemonic, normalizeMnemonic } from './mnemonic';

// 복구 문구는 이 파일만 읽고 쓴다(docs/PROJECT.md 보안 모델).
const MNEMONIC_KEY = 'wallet.mnemonic';
const ADDRESS_KEY = 'wallet.address';

const SECRET: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  requireAuthentication: true,
  authenticationPrompt: '지갑 잠금 해제',
};

// 주소는 공개 정보라 인증 없이 읽는다. 앱을 지워도 Keychain에 남아 재설치 때 지갑을 찾는 데 쓴다.
const PUBLIC: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export function loadAddress(): Promise<string | null> {
  return SecureStore.getItemAsync(ADDRESS_KEY, PUBLIC);
}

/** 복구 문구를 저장하고 주소를 돌려준다. 이미 지갑이 있으면 덮어쓰지 않는다. */
export async function saveWallet(input: string): Promise<string> {
  const phrase = normalizeMnemonic(input);
  if (!isValidMnemonic(phrase)) throw new WalletError('InvalidMnemonic');
  if (await loadAddress()) throw new WalletError('WalletExists');
  if (!SecureStore.canUseBiometricAuthentication()) throw new WalletError('BiometricsUnavailable');

  const { address } = deriveWallet(phrase);
  await SecureStore.setItemAsync(MNEMONIC_KEY, phrase, SECRET);
  await SecureStore.setItemAsync(ADDRESS_KEY, address, PUBLIC);
  return address;
}

/** Face ID로 복구 문구를 읽어 서명 키를 만들고 fn에만 넘긴다. 키는 저장하지 않는다. */
export async function withSigner<T>(fn: (signer: HDNodeWallet) => Promise<T>): Promise<T> {
  let phrase: string | null;
  try {
    phrase = await SecureStore.getItemAsync(MNEMONIC_KEY, SECRET);
  } catch (cause) {
    throw new WalletError('AuthCancelled', { cause });
  }
  if (!phrase) throw new WalletError('WalletNotFound');
  return fn(deriveWallet(phrase));
}

export async function deleteWallet(): Promise<void> {
  await SecureStore.deleteItemAsync(MNEMONIC_KEY, SECRET);
  await SecureStore.deleteItemAsync(ADDRESS_KEY, PUBLIC);
}
