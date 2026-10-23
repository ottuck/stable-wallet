import { keccak256, Mnemonic, toUtf8Bytes } from 'ethers';

/**
 * 데모(전시)에서 보이는 가짜 값은 모두 여기 둔다. 값을 바꿔 보여주고 싶으면 이 파일만 고친다.
 * 실제 앱 코드·실제 자산과는 상관없다.
 */
export const DEMO = {
  /**
   * 데모 지갑의 복구 문구. 공개 사이트라 무작위로 만들지 않고 누구나 아는 고정 문구를 쓴다
   * (새 지갑·가져오기·처음부터 있는 지갑 모두 이 문구다). 이 주소로 받은 돈은 누구든 가져갈 수 있다.
   */
  phrase: Mnemonic.fromEntropy(keccak256(toUtf8Bytes('henry-wallet-demo')).slice(0, 34)).phrase,

  /** 위 문구의 entropy(16바이트). 데모의 "난수"는 늘 이 값이라 새 지갑도 같은 문구가 된다 */
  entropy: keccak256(toUtf8Bytes('henry-wallet-demo')).slice(0, 34),

  /** 붙여넣기·QR 스캔이 채워 주는 받는 주소(EIP-55 예시 주소) */
  recipient: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',

  /** 받기 화면 QR에 담는 글. 주소가 아니라서 찍어도 어느 지갑도 송금 주소로 받지 않는다 */
  qrText: 'Henry Wallet demo - not a real address. Do not send funds.',

  /** ms. 네트워크 응답, Face ID 서명, 블록 확정을 기다리는 시간 */
  latency: { rpc: 400, sign: 1100, confirm: 5000 },

  /** 지갑을 열 때 보이는 잔액(사람이 읽는 단위). 네트워크마다 같은 값으로 시작한다. */
  balances: { native: '0.42', USDC: '1284.56', JPYC: '48200' } as Record<string, string>,

  /** 이미 체인에 확정된 nonce 개수. 새 거래는 이 값부터 쓴다. */
  startNonce: 10,

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
    // 홈에는 최근 5건만 보이므로 "전체 보기"가 나오도록 오래된 거래를 더 둔다
    {
      symbol: 'JPYC',
      amount: '12000',
      to: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
      status: 'confirmed' as const,
      daysAgo: 9,
    },
    {
      symbol: 'USDC',
      amount: '40',
      to: '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
      status: 'confirmed' as const,
      daysAgo: 14,
    },
    {
      symbol: 'USDC',
      amount: '250',
      to: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      status: 'confirmed' as const,
      daysAgo: 21,
    },
    {
      symbol: 'JPYC',
      amount: '5000',
      to: '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
      status: 'confirmed' as const,
      daysAgo: 30,
    },
  ],
};

/** 가짜 tx hash. 같은 번호면 항상 같은 값이다. */
export function fakeHash(n: number): string {
  return keccak256(toUtf8Bytes(`henry-wallet-demo-${n}`));
}
