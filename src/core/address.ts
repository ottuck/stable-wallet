import { getAddress, ZeroAddress } from 'ethers';

import { WalletError } from './errors';

const HEX_ADDRESS = /^0x[0-9a-fA-F]{40}$/;

/**
 * 수신 주소를 검증해 체크섬 주소로 돌려준다.
 * 대소문자가 섞인 주소는 EIP-55 체크섬을 검사한다. 0 주소와 토큰 컨트랙트 주소(보내면 잃는다)는 거부한다.
 */
export function parseRecipient(input: string, tokenAddresses: readonly string[]): string {
  const value = input.trim();
  if (!HEX_ADDRESS.test(value)) throw new WalletError('InvalidAddress');
  let address: string;
  try {
    address = getAddress(value);
  } catch {
    throw new WalletError('InvalidAddress');
  }
  if (address === ZeroAddress) throw new WalletError('InvalidAddress');
  if (tokenAddresses.some((t) => t.toLowerCase() === address.toLowerCase())) {
    throw new WalletError('InvalidAddress');
  }
  return address;
}
