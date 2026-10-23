import * as SQLite from 'expo-sqlite';

import type { NetworkId } from '@/core/config/networks';
import type { TxStatus, WalletTx } from '@/core/history';

// 거래 기록·설정을 기기 SQLite에 둔다. platform/services만 이 파일을 다시 내보낸다(웹 데모는 메모리 저장소).
// 비민감 데이터만 둔다. 복구 문구·키는 절대 넣지 않는다.
let db: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('wallet.db');
    db.execSync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS tx (
        hash TEXT PRIMARY KEY,
        networkId TEXT NOT NULL,
        symbol TEXT NOT NULL,
        decimals INTEGER NOT NULL,
        fromAddress TEXT NOT NULL,
        toAddress TEXT NOT NULL,
        amount TEXT NOT NULL,
        nonce INTEGER NOT NULL,
        status TEXT NOT NULL,
        createdAt INTEGER NOT NULL
      );
    `);
  }
  return db;
}

/** 이 설치에서 앱을 연 적이 있는지. 재설치하면 SQLite가 지워져 false가 된다. */
export function isInstalled(): boolean {
  return getDb().getFirstSync('SELECT 1 FROM meta WHERE key = ?', 'installedAt') !== null;
}

export function markInstalled(): void {
  getDb().runSync(
    'INSERT OR IGNORE INTO meta (key, value) VALUES (?, ?)',
    'installedAt',
    new Date().toISOString(),
  );
}

/** 앱 설정처럼 비민감한 값을 key-value로 둔다(설치 표시와 같은 meta 표). */
export function getMeta(key: string): string | null {
  return (
    getDb().getFirstSync<{ value: string }>('SELECT value FROM meta WHERE key = ?', key)?.value ??
    null
  );
}

export function setMeta(key: string, value: string): void {
  getDb().runSync('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', key, value);
}

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
