import { HDNodeWallet, Mnemonic } from 'ethers';

import { randomBytes } from '../../platform/services';

/** MetaMask 첫 계정과 같은 경로. 같은 복구 문구면 MetaMask에서도 같은 주소가 나온다. */
export const DERIVATION_PATH = "m/44'/60'/0'/0/0";

/** 12단어(128bit entropy). 난수는 기기의 crypto.getRandomValues(platform/services). */
export function generateMnemonic(): string {
  return Mnemonic.fromEntropy(randomBytes(16)).phrase;
}

export function normalizeMnemonic(input: string): string {
  return input.trim().toLowerCase().split(/\s+/).join(' ');
}

export function isValidMnemonic(phrase: string): boolean {
  return Mnemonic.isValidMnemonic(phrase);
}

/** 화면에는 주소만 넘긴다. 키를 가진 wallet 객체는 core/keys 밖으로 나가지 않는다. */
export function deriveAddress(phrase: string): string {
  return deriveWallet(phrase).address;
}

export function deriveWallet(phrase: string): HDNodeWallet {
  return HDNodeWallet.fromPhrase(phrase, undefined, DERIVATION_PATH);
}
