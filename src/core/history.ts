import type { NetworkId } from './config/networks';
import { getDb } from './db';

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

export function saveTx(tx: WalletTx): void {
  getDb().runSync(
    `INSERT OR REPLACE INTO tx
      (hash, networkId, symbol, decimals, fromAddress, toAddress, amount, nonce, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    tx.hash,
    tx.networkId,
    tx.symbol,
    tx.decimals,
    tx.fromAddress,
    tx.toAddress,
    tx.amount,
    tx.nonce,
    tx.status,
    tx.createdAt,
  );
}

export function updateTxStatus(hash: string, status: TxStatus): void {
  getDb().runSync('UPDATE tx SET status = ? WHERE hash = ?', status, hash);
}

export function listTxs(fromAddress: string, networkId: NetworkId, limit = 20): WalletTx[] {
  return getDb().getAllSync<WalletTx>(
    'SELECT * FROM tx WHERE fromAddress = ? AND networkId = ? ORDER BY createdAt DESC LIMIT ?',
    fromAddress,
    networkId,
    limit,
  );
}

/** 거래 하나(상세 화면). 없으면 null */
export function getTx(hash: string): WalletTx | null {
  return getDb().getFirstSync<WalletTx>('SELECT * FROM tx WHERE hash = ?', hash);
}

/** 이 주소로 보낸 적이 있는지(처음 보내는 주소 경고용) */
export function hasSentTo(fromAddress: string, toAddress: string): boolean {
  return (
    getDb().getFirstSync(
      'SELECT 1 FROM tx WHERE fromAddress = ? AND lower(toAddress) = lower(?)',
      fromAddress,
      toAddress,
    ) !== null
  );
}

export function listPendingTxs(): WalletTx[] {
  return getDb().getAllSync<WalletTx>("SELECT * FROM tx WHERE status = 'pending'");
}
