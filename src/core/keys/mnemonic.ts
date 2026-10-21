import { HDNodeWallet, Mnemonic, randomBytes } from 'ethers';

/** MetaMask 첫 계정과 같은 경로. 같은 복구 문구면 MetaMask에서도 같은 주소가 나온다. */
export const DERIVATION_PATH = "m/44'/60'/0'/0/0";

/** 12단어(128bit entropy). randomBytes는 react-native-get-random-values의 crypto.getRandomValues를 쓴다. */
export function generateMnemonic(): string {
  return Mnemonic.fromEntropy(randomBytes(16)).phrase;
}

export function normalizeMnemonic(input: string): string {
  return input.trim().toLowerCase().split(/\s+/).join(' ');
}

export function isValidMnemonic(phrase: string): boolean {
  return Mnemonic.isValidMnemonic(phrase);
}

export function deriveWallet(phrase: string): HDNodeWallet {
  return HDNodeWallet.fromPhrase(phrase, undefined, DERIVATION_PATH);
}
