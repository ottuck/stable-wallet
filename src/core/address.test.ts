import { parseAddressQr, parseRecipient } from './address';

const USDC = '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582';
const ADDRESS = '0x9858EfFD232B4033E47d90003D41EC34EcaEda94';

describe('parseRecipient', () => {
  it('소문자 주소를 체크섬 주소로 바꾼다', () => {
    expect(parseRecipient(` ${ADDRESS.toLowerCase()} `, [USDC])).toBe(ADDRESS);
  });

  it('체크섬이 틀린 주소를 거부한다', () => {
    expect(() => parseRecipient(ADDRESS.replace('E', 'e'), [USDC])).toThrow('InvalidAddress');
  });

  it.each([
    ['0 주소', '0x0000000000000000000000000000000000000000'],
    ['토큰 컨트랙트', USDC.toLowerCase()],
    ['길이 오류', ADDRESS.slice(0, -1)],
    ['접두사 없음', ADDRESS.slice(2)],
  ])('%s는 거부한다', (_, input) => {
    expect(() => parseRecipient(input, [USDC])).toThrow('InvalidAddress');
  });
});

describe('parseAddressQr', () => {
  it('주소만 있는 QR과 EIP-681 주소를 읽는다', () => {
    expect(parseAddressQr(ADDRESS)).toEqual({ address: ADDRESS });
    expect(parseAddressQr(`ethereum:${ADDRESS}@80002`)).toEqual({
      address: ADDRESS,
      chainId: 80002,
    });
  });

  it('ERC-20 결제 URI는 토큰 컨트랙트가 아니라 받는 사람 주소를 쓴다', () => {
    expect(
      parseAddressQr(`ethereum:${USDC}@80002/transfer?address=${ADDRESS}&uint256=1e6`),
    ).toEqual({ address: ADDRESS, chainId: 80002 });
  });

  it('주소가 아닌 QR은 null', () => {
    expect(parseAddressQr('https://example.com')).toBeNull();
    expect(parseAddressQr(`${ADDRESS} 메모`)).toBeNull();
  });
});
