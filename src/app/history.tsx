import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { TxRow } from '@/features/history/tx-row';
import { useRecentTxs } from '@/features/history/use-recent-txs';
import { useT } from '@/features/i18n';
import { useNetwork } from '@/features/network-store';
import { Card, Label, Screen } from '@/features/ui';
import { useWallet } from '@/features/wallet/store';

/** 개인 지갑이 이 앱에서 보낸 거래는 많지 않아 나눠 읽지 않고 한 번에 읽는다 */
const ALL_TXS = 1000;

/** 지금 네트워크에서 이 앱으로 보낸 거래 전부. 홈의 "전체 보기"에서 연다. */
export default function History() {
  const t = useT();
  const address = useWallet((s) => s.address)!;
  const network = useNetwork((s) => s.network);
  const [refreshKey, setRefreshKey] = useState(0);
  const txs = useRecentTxs(network, address, refreshKey, ALL_TXS);

  // 거래 상세에서 돌아오면 바뀐 상태를 다시 읽는다
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focusedOnce.current) setRefreshKey((k) => k + 1);
      focusedOnce.current = true;
    }, []),
  );

  return (
    <Screen onRefresh={() => setRefreshKey((k) => k + 1)}>
      <Label muted size={13} style={{ paddingHorizontal: 4 }}>
        {network.name}
      </Label>
      <Card style={{ paddingVertical: 4, gap: 0 }}>
        {txs.length === 0 ? (
          <Label muted size={13} style={{ paddingVertical: 20, textAlign: 'center' }}>
            {t.home.noTxsTitle}
          </Label>
        ) : (
          txs.map((tx, i) => <TxRow key={tx.hash} tx={tx} last={i === txs.length - 1} />)
        )}
      </Card>
    </Screen>
  );
}
