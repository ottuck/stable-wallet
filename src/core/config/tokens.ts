import type { NetworkId } from './networks';

export type TokenConfig = {
  networkId: NetworkId;
  symbol: 'USDC' | 'JPYC';
  address: string;
  decimals: number;
};

// USDC: Circle 공식 주소(developers.circle.com/stablecoins/usdc-contract-addresses).
// 2026-10-21 각 체인 RPC로 symbol·decimals를 조회해 확인했다.
// Polygon은 native USDC만 쓴다(브릿지된 USDC.e 0x2791…4174는 지원하지 않는다).
// JPYC: 자금이동업(전자결제수단) JPYC. 네 체인 모두 같은 주소.
// 출처: JPYC 공식 GitHub(github.com/jpycoin), JPYC Faucet(faucet.jpyc.co.jp) 코드, CoinGecko(jpycoin)가 모두 같은 값.
// 2026-10-22 각 체인 RPC로 name "JPY Coin"·symbol·decimals 18 확인. 이전 선불식 JPYC(0x431D…7BDB)는 다른 토큰이라 쓰지 않는다.
// 테스트넷(Amoy·Sepolia) JPYC는 같은 주소, faucet.jpyc.co.jp에서 받는다.
const JPYC = '0xE7C3D8C9a439feDe00D2600032D5dB0Be71C3c29';

export const TOKENS: TokenConfig[] = [
  {
    networkId: 'polygon',
    symbol: 'USDC',
    address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    decimals: 6,
  },
  {
    networkId: 'ethereum',
    symbol: 'USDC',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    decimals: 6,
  },
  {
    networkId: 'polygon-amoy',
    symbol: 'USDC',
    address: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
    decimals: 6,
  },
  {
    networkId: 'sepolia',
    symbol: 'USDC',
    address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    decimals: 6,
  },
  { networkId: 'polygon', symbol: 'JPYC', address: JPYC, decimals: 18 },
  { networkId: 'ethereum', symbol: 'JPYC', address: JPYC, decimals: 18 },
  { networkId: 'polygon-amoy', symbol: 'JPYC', address: JPYC, decimals: 18 },
  { networkId: 'sepolia', symbol: 'JPYC', address: JPYC, decimals: 18 },
];

export function tokensOn(networkId: NetworkId): TokenConfig[] {
  return TOKENS.filter((t) => t.networkId === networkId);
}
