import * as SQLite from 'expo-sqlite';

// 비민감 데이터만 둔다. 복구 문구·키는 절대 넣지 않는다.
let db: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('wallet.db');
    db.execSync(
      'PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);',
    );
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
