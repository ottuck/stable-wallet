import { useEffect, useState } from 'react';

import type { NetworkConfig } from '@/core/config/networks';
import { estimateTransferFee, getBalances, type AssetBalance } from '@/core/evm/balances';

type Result = {
  /** 어느 네트워크·주소의 값인지 */
  key: string;
  /** 몇 번째 새로고침의 값인지 */
  version: number;
  balances: AssetBalance[] | null;
  transferFee: bigint | null;
  error: unknown;
};

export function useBalances(network: NetworkConfig, address: string) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const key = `${network.id}:${address}`;

  useEffect(() => {
    let active = true;
    // 수수료 추정은 "전송 약 N회" 표시용이라 실패해도 잔액은 보여준다
    const transferFee = estimateTransferFee(network).catch(() => null);
    Promise.all([getBalances(network, address), transferFee]).then(
      ([balances, transferFee]) =>
        active && setResult({ key, version, balances, transferFee, error: null }),
      (error: unknown) =>
        active && setResult({ key, version, balances: null, transferFee: null, error }),
    );
    return () => {
      active = false;
    };
  }, [key, version, network, address]);

  // 다른 네트워크·주소의 결과는 보여주지 않는다. 같은 곳을 새로고침하는 동안에는 이전 값을 그대로 둬
  // 잔액·수수료 줄이 잠깐 사라졌다 나타나며 화면이 움직이지 않게 한다
  const current = result?.key === key ? result : null;
  return {
    balances: current?.balances ?? null,
    transferFee: current?.transferFee ?? null,
    error: current?.error ?? null,
    loading: current?.version !== version,
    refresh: () => setVersion((v) => v + 1),
  };
}
