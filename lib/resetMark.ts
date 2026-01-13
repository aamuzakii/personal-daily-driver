import SQLite from 'react-native-sqlite-storage';

export const DEFAULT_DB_NAME = 'app.db';
export const RESET_MARK_TABLE = 'explore_reset_mark';

export const logSqliteDb = async (db: any, label = 'sqlite') => {
  try {
    const list = await execSql(db, 'PRAGMA database_list');
    const dbList: any[] = [];
    for (let i = 0; i < (list?.rows?.length ?? 0); i++) dbList.push(list.rows.item(i));

    const tablesRes = await execSql(
      db,
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );
    const tables: string[] = [];
    for (let i = 0; i < (tablesRes?.rows?.length ?? 0); i++) tables.push(tablesRes.rows.item(i).name);

    console.log(`[${label}] database_list:`, dbList);
    console.log(`[${label}] tables:`, tables);

    for (const t of tables) {
      const rowsRes = await execSql(db, `SELECT * FROM ${t} LIMIT 200`);
      const rows: any[] = [];
      for (let i = 0; i < (rowsRes?.rows?.length ?? 0); i++) rows.push(rowsRes.rows.item(i));
      console.log(`[${label}] ${t} rows(${rows.length}):`, rows);
    }
  } catch (e) {
    console.log(`[${label}] failed to log sqlite db:`, e);
  }
};

export const getSqliteDbDump = async (db: any, limitPerTable = 200) => {
  const out: {
    database_list: any[];
    tables: Record<string, any[]>;
  } = { database_list: [], tables: {} };

  const list = await execSql(db, 'PRAGMA database_list');
  for (let i = 0; i < (list?.rows?.length ?? 0); i++) out.database_list.push(list.rows.item(i));

  const tablesRes = await execSql(
    db,
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
  const tables: string[] = [];
  for (let i = 0; i < (tablesRes?.rows?.length ?? 0); i++) tables.push(tablesRes.rows.item(i).name);

  for (const t of tables) {
    const rowsRes = await execSql(db, `SELECT * FROM ${t} LIMIT ${Number(limitPerTable)}`);
    const rows: any[] = [];
    for (let i = 0; i < (rowsRes?.rows?.length ?? 0); i++) rows.push(rowsRes.rows.item(i));
    out.tables[t] = rows;
  }

  return JSON.stringify(out, null, 2);
};

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
  // await logSqliteDb(db, 'resetMark.ensureResetMarkTable');
};

export const hasResetMark = async (db: any, resetKey: string, table = RESET_MARK_TABLE) => {
  const res = await execSql(db, `SELECT reset_key FROM ${table} WHERE reset_key = ? LIMIT 1`, [resetKey]);
  return (res?.rows?.length ?? 0) > 0;
};

export const markReset = async (db: any, resetKey: string, table = RESET_MARK_TABLE) => {
  await execSql(db, `INSERT OR IGNORE INTO ${table} (reset_key) VALUES (?)`, [resetKey]);
  await logSqliteDb(db, 'resetMark.markReset');
};
