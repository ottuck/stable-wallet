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
// JPYC: 공식 발표의 현재 컨트랙트를 확인한 뒤 더한다(docs/ROADMAP.md).
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
];

export function tokensOn(networkId: NetworkId): TokenConfig[] {
  return TOKENS.filter((t) => t.networkId === networkId);
}
