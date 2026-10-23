import { useEffect, useMemo, useState } from 'react';

import type { NetworkConfig } from '@/core/config/networks';
import { listTxs } from '@/core/history';
import { refreshPendingTransfers } from '@/core/transfer';

/**
 * 이 네트워크에서 보낸 최근 거래. pending인 거래는 열 때마다 receipt를 다시 확인한다
 * (전송 상태 화면을 닫았거나 앱을 껐다 켠 경우).
 */
export function useRecentTxs(
  network: NetworkConfig,
  address: string,
  refreshKey: number,
  limit: number,
) {
  const [checked, setChecked] = useState(0);
  const txs = useMemo(
    () => listTxs(address, network.id, limit),
    // checked·refreshKey가 바뀌면 SQLite를 다시 읽는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [address, network.id, limit, checked, refreshKey],
  );

  useEffect(() => {
    let active = true;
    refreshPendingTransfers().then((count) => {
      if (active && count > 0) setChecked((n) => n + 1);
    });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  return txs;
}
