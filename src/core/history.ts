import type { NetworkId } from './config/networks';

// 앱이 보낸 거래 기록의 모양. 저장은 platform(기기 SQLite, 웹 데모는 메모리)이 한다.
export {
  getTx,
  hasSentTo,
  listPendingTxs,
  listTxs,
  saveTx,
  updateTxStatus,
} from '../platform/services';

export type TxStatus = 'pending' | 'confirmed' | 'failed' | 'dropped';

/** 앱이 직접 보낸 거래. amount는 raw 단위 bigint를 문자열로 둔다. */
export type WalletTx = {
  hash: string;
  networkId: NetworkId;
  symbol: string;
  decimals: number;
  fromAddress: string;
  toAddress: string;
  amount: string;
  nonce: number;
  status: TxStatus;
  createdAt: number;
};
