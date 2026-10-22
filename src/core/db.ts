import * as SQLite from 'expo-sqlite';

// 비민감 데이터만 둔다. 복구 문구·키는 절대 넣지 않는다.
let db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
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
