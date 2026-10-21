import { useEffect, useState } from 'react';

import type { NetworkConfig } from '@/core/config/networks';
import { estimateTransferFee, getBalances, type AssetBalance } from '@/core/evm/balances';

type Result = {
  key: string;
  balances: AssetBalance[] | null;
  transferFee: bigint | null;
  error: unknown;
};

export function useBalances(network: NetworkConfig, address: string) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const key = `${network.id}:${address}:${version}`;

  useEffect(() => {
    let active = true;
    // 수수료 추정은 "전송 약 N회" 표시용이라 실패해도 잔액은 보여준다
    const transferFee = estimateTransferFee(network).catch(() => null);
    Promise.all([getBalances(network, address), transferFee]).then(
      ([balances, transferFee]) => active && setResult({ key, balances, transferFee, error: null }),
      (error: unknown) => active && setResult({ key, balances: null, transferFee: null, error }),
    );
    return () => {
      active = false;
    };
  }, [key, network, address]);

  // 다른 네트워크·이전 요청의 결과는 보여주지 않는다
  const current = result?.key === key ? result : null;
  return {
    balances: current?.balances ?? null,
    transferFee: current?.transferFee ?? null,
    error: current?.error ?? null,
    loading: current === null,
    refresh: () => setVersion((v) => v + 1),
  };
}
