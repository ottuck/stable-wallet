import { deriveWallet, isValidMnemonic, normalizeMnemonic } from './mnemonic';

// BIP-39 공개 test vector. 실제 자산에 쓰지 않는다.
const PHRASE =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

describe('mnemonic', () => {
  it("m/44'/60'/0'/0/0에서 MetaMask 첫 계정과 같은 주소를 만든다", () => {
    expect(deriveWallet(PHRASE).address).toBe('0x9858EfFD232B4033E47d90003D41EC34EcaEda94');
  });

  it('입력의 공백·대문자를 정리하고 체크섬이 틀린 문구를 거부한다', () => {
    expect(normalizeMnemonic(`  ${PHRASE.toUpperCase().replaceAll(' ', '   ')}\n`)).toBe(PHRASE);
    expect(isValidMnemonic(PHRASE)).toBe(true);
    expect(isValidMnemonic(PHRASE.replace(/about$/, 'abandon'))).toBe(false);
  });
});
