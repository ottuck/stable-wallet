import { getAddress, ZeroAddress } from 'ethers';

import { WalletError } from './errors';

const HEX_ADDRESS = /^0x[0-9a-fA-F]{40}$/;

const ADDRESS_IN_TEXT = /0x[0-9a-fA-F]{40}/;

/**
 * QR 내용에서 받는 주소를 꺼낸다. 그냥 주소이거나 EIP-681(`ethereum:<주소>[@chainId]`).
 * ERC-20 결제 URI(`ethereum:<토큰>@<chainId>/transfer?address=<받는 사람>`)는 앞의 주소가 토큰
 * 컨트랙트이므로 address 파라미터를 쓴다. 검증은 parseRecipient가 한다.
 */
export function parseAddressQr(text: string): { address: string; chainId?: number } | null {
  const value = text.trim();
  if (!value.toLowerCase().startsWith('ethereum:')) {
    const match = value.match(ADDRESS_IN_TEXT);
    return match && match[0] === value ? { address: value } : null;
  }
  const uri = value.slice('ethereum:'.length).replace(/^pay-/, '');
  const [target, query = ''] = uri.split('?');
  const [head, fn] = target.split('/');
  const [first, chain] = head.split('@');
  const chainId = chain ? Number(chain) : undefined;
  // transfer 말고 다른 함수 호출(approve 등) URI는 받는 주소가 아니다
  if (fn !== undefined && fn !== 'transfer') return null;
  const address = fn === 'transfer' ? (new URLSearchParams(query).get('address') ?? '') : first;
  if (!HEX_ADDRESS.test(address) || (chainId !== undefined && !Number.isInteger(chainId))) {
    return null;
  }
  return { address, chainId };
}

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
