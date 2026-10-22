import { WalletError } from '@/core/errors';
import {
  deriveWallet,
  generateMnemonic,
  isValidMnemonic,
  normalizeMnemonic,
} from '@/core/keys/mnemonic';
import type * as Real from '@/core/keys/vault';
import type { HDNodeWallet } from 'ethers';

import { DEMO } from '../data';
import { mode } from '../mode';
import { sleep } from '../sleep';

// 실제 파일(src/core/keys/vault.ts)은 secure-store와 Face ID를 쓴다. 데모의 가짜 보안 저장소다.
// 키는 이 페이지의 메모리에만 있고, 어디에도 저장·출력하지 않으며, 새로고침하면 새 키가 만들어진다.
let wallet: HDNodeWallet | null = mode === 'empty' ? null : deriveWallet(generateMnemonic());

export const loadAddress: typeof Real.loadAddress = async () => {
  if (mode === 'error') throw new Error('demo: secure store unavailable');
  return wallet?.address ?? null;
};

export const saveWallet: typeof Real.saveWallet = async (input) => {
  const phrase = normalizeMnemonic(input);
  if (!isValidMnemonic(phrase)) throw new WalletError('InvalidMnemonic');
  if (wallet) throw new WalletError('WalletExists');
  wallet = deriveWallet(phrase);
  return wallet.address;
};

export const withSigner: typeof Real.withSigner = async (fn) => {
  if (!wallet) throw new WalletError('WalletNotFound');
  await sleep(DEMO.latency.sign);
  return fn(wallet);
};

export const deleteWallet: typeof Real.deleteWallet = async () => {
  wallet = null;
};
