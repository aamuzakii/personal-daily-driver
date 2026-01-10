import SQLite from 'react-native-sqlite-storage';

export const DEFAULT_DB_NAME = 'app.db';
export const RESET_MARK_TABLE = 'explore_reset_mark';

export const toYmd = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const openAppDb = (dbName = DEFAULT_DB_NAME) => SQLite.openDatabase({ name: dbName, location: 'default' });

export const execSql = (db: any, sql: string, params: any[] = []) =>
  new Promise<any>((resolve, reject) => {
    db.transaction(
      (tx: any) => {
        tx.executeSql(
          sql,
          params,
          (_: any, res: any) => resolve(res),
          (_: any, err: any) => {
            reject(err);
            return false;
          }
        );
      },
      (err: any) => reject(err)
    );
  });

export const ensureResetMarkTable = async (db: any, table = RESET_MARK_TABLE) => {
  await execSql(db, `CREATE TABLE IF NOT EXISTS ${table} (reset_key TEXT PRIMARY KEY NOT NULL)`);
};

export const hasResetMark = async (db: any, resetKey: string, table = RESET_MARK_TABLE) => {
  const res = await execSql(db, `SELECT reset_key FROM ${table} WHERE reset_key = ? LIMIT 1`, [resetKey]);
  return (res?.rows?.length ?? 0) > 0;
};

export const markReset = async (db: any, resetKey: string, table = RESET_MARK_TABLE) => {
  await execSql(db, `INSERT OR IGNORE INTO ${table} (reset_key) VALUES (?)`, [resetKey]);
};
