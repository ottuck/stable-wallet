import { keccak256, toUtf8Bytes } from 'ethers';

/**
 * 데모(전시)에서 보이는 가짜 값은 모두 여기 둔다. 값을 바꿔 보여주고 싶으면 이 파일만 고친다.
 * 실제 앱 코드·실제 자산과는 상관없다.
 */
export const DEMO = {
  /** ms. 네트워크 응답, Face ID 서명, 블록 확정을 기다리는 시간 */
  latency: { rpc: 400, sign: 700, confirm: 5000 },

  /** 지갑을 열 때 보이는 잔액(사람이 읽는 단위). 네트워크마다 같은 값으로 시작한다. */
  balances: { native: '0.42', USDC: '1284.56', JPYC: '48200' } as Record<string, string>,

  /** 이미 체인에 확정된 nonce 개수. 새 거래는 이 값부터 쓴다. */
  startNonce: 5,

  /** 수수료. gwei 단위 문자열 */
  fees: { baseGwei: '30', priorityGwei: '30', gasEstimate: 52_000n },

  /** 보낸 거래 내역(최신순). daysAgo는 오늘로부터 며칠 전인지 */
  history: [
    {
      symbol: 'USDC',
      amount: '100',
      to: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      status: 'confirmed' as const,
      daysAgo: 1,
    },
    {
      symbol: 'JPYC',
      amount: '3000',
      to: '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
      status: 'confirmed' as const,
      daysAgo: 3,
    },
    {
      symbol: 'USDC',
      amount: '25',
      to: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      status: 'failed' as const,
      daysAgo: 6,
    },
  ],
};

/** 가짜 tx hash. 같은 번호면 항상 같은 값이다. */
export function fakeHash(n: number): string {
  return keccak256(toUtf8Bytes(`henry-wallet-demo-${n}`));
}
