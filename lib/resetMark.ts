import SQLite from 'react-native-sqlite-storage';

export const DEFAULT_DB_NAME = 'app.db';
export const RESET_MARK_TABLE = 'explore_reset_mark';
export const ZIKR_TABLE = 'zikr';
export const GENERAL_TODO_TABLE = 'general_todo';
export const BLIND75_WATCH_TABLE = 'blind75_watch';

export const logSqliteDb = async (db: any, label = 'sqlite') => {
  try {
    const list = await execSql(db, 'PRAGMA database_list');
    const dbList: any[] = [];
    for (let i = 0; i < (list?.rows?.length ?? 0); i++)
      dbList.push(list.rows.item(i));

    const tablesRes = await execSql(
      db,
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    );
    const tables: string[] = [];
    for (let i = 0; i < (tablesRes?.rows?.length ?? 0); i++)
      tables.push(tablesRes.rows.item(i).name);

    console.log(`[${label}] database_list:`, dbList);
    console.log(`[${label}] tables:`, tables);

    for (const t of tables) {
      const rowsRes = await execSql(db, `SELECT * FROM ${t} LIMIT 200`);
      const rows: any[] = [];
      for (let i = 0; i < (rowsRes?.rows?.length ?? 0); i++)
        rows.push(rowsRes.rows.item(i));
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
  for (let i = 0; i < (list?.rows?.length ?? 0); i++)
    out.database_list.push(list.rows.item(i));

  const tablesRes = await execSql(
    db,
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  );
  const tables: string[] = [];
  for (let i = 0; i < (tablesRes?.rows?.length ?? 0); i++)
    tables.push(tablesRes.rows.item(i).name);

  for (const t of tables) {
    const rowsRes = await execSql(
      db,
      `SELECT * FROM ${t} LIMIT ${Number(limitPerTable)}`,
    );
    const rows: any[] = [];
    for (let i = 0; i < (rowsRes?.rows?.length ?? 0); i++)
      rows.push(rowsRes.rows.item(i));
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

export const openAppDb = (dbName = DEFAULT_DB_NAME) =>
  SQLite.openDatabase({ name: dbName, location: 'default' });

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
          },
        );
      },
      (err: any) => reject(err),
    );
  });

export const ensureResetMarkTable = async (
  db: any,
  table = RESET_MARK_TABLE,
) => {
  await execSql(
    db,
    `CREATE TABLE IF NOT EXISTS ${table} (reset_key TEXT PRIMARY KEY NOT NULL)`,
  );
  // await logSqliteDb(db, 'resetMark.ensureResetMarkTable');
};

export const hasResetMark = async (
  db: any,
  resetKey: string,
  table = RESET_MARK_TABLE,
) => {
  const res = await execSql(
    db,
    `SELECT reset_key FROM ${table} WHERE reset_key = ? LIMIT 1`,
    [resetKey],
  );
  return (res?.rows?.length ?? 0) > 0;
};

export const markReset = async (
  db: any,
  resetKey: string,
  table = RESET_MARK_TABLE,
) => {
  await execSql(db, `INSERT OR IGNORE INTO ${table} (reset_key) VALUES (?)`, [
    resetKey,
  ]);
  await logSqliteDb(db, 'resetMark.markReset');
};

export const ensureZikrTable = async (db: any, table = ZIKR_TABLE) => {
  await execSql(
    db,
    `CREATE TABLE IF NOT EXISTS ${table} (item_idx INTEGER PRIMARY KEY NOT NULL, checked INTEGER NOT NULL)`,
  );
};

export const loadZikrChecked = async (db: any, table = ZIKR_TABLE) => {
  const res = await execSql(db, `SELECT item_idx, checked FROM ${table}`);
  const map = new Map<number, boolean>();
  for (let i = 0; i < (res?.rows?.length ?? 0); i++) {
    const r = res.rows.item(i);
    const idx = Number(r?.item_idx);
    if (!Number.isFinite(idx)) continue;
    map.set(idx, Number(r?.checked) === 1);
  }
  return map;
};

export const setZikrCheckedAt = async (
  db: any,
  itemIdx: number,
  checked: boolean,
  table = ZIKR_TABLE,
) => {
  await execSql(
    db,
    `INSERT INTO ${table} (item_idx, checked) VALUES (?, ?) ON CONFLICT(item_idx) DO UPDATE SET checked=excluded.checked`,
    [itemIdx, checked ? 1 : 0],
  );
};

export const clearZikrChecked = async (db: any, table = ZIKR_TABLE) => {
  await execSql(db, `DELETE FROM ${table}`);
};

export const ensureGeneralTodoTable = async (
  db: any,
  table = GENERAL_TODO_TABLE,
) => {
  await execSql(
    db,
    `CREATE TABLE IF NOT EXISTS ${table} (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      link TEXT,
      score INTEGER NOT NULL,
      done INTEGER NOT NULL
    )`,
  );
};

export const loadGeneralTodos = async (db: any, table = GENERAL_TODO_TABLE) => {
  const res = await execSql(
    db,
    `SELECT id, title, link, score, done FROM ${table} ORDER BY rowid ASC`,
  );
  const rows: any[] = [];
  for (let i = 0; i < (res?.rows?.length ?? 0); i++)
    rows.push(res.rows.item(i));
  return rows.map((r) => ({
    id: String(r?.id),
    title: String(r?.title ?? ''),
    link: r?.link === null || r?.link === undefined ? '' : String(r.link),
    score: Number(r?.score ?? 0),
    done: Number(r?.done) === 1,
  }));
};

export const upsertGeneralTodos = async (
  db: any,
  todos: {
    id: string;
    title: string;
    link?: string;
    score: number;
    done: boolean;
  }[],
  table = GENERAL_TODO_TABLE,
) => {
  for (const t of todos) {
    await execSql(
      db,
      `INSERT INTO ${table} (id, title, link, score, done)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title=excluded.title,
         link=excluded.link,
         score=excluded.score,
         done=excluded.done`,
      [
        String(t.id),
        String(t.title ?? ''),
        t.link ? String(t.link) : '',
        Number(t.score ?? 0),
        t.done ? 1 : 0,
      ],
    );
  }
};

export const clearGeneralTodos = async (
  db: any,
  table = GENERAL_TODO_TABLE,
) => {
  await execSql(db, `DELETE FROM ${table}`);
};

export const ensureBlind75WatchTable = async (
  db: any,
  table = BLIND75_WATCH_TABLE,
) => {
  await execSql(
    db,
    `CREATE TABLE IF NOT EXISTS ${table} (
      video_id TEXT PRIMARY KEY NOT NULL,
      watch_count INTEGER NOT NULL DEFAULT 0,
      updated_ms INTEGER NOT NULL DEFAULT 0
    )`,
  );
};

export const loadBlind75WatchCounts = async (
  db: any,
  table = BLIND75_WATCH_TABLE,
) => {
  const res = await execSql(db, `SELECT video_id, watch_count FROM ${table}`);
  const map = new Map<string, number>();
  for (let i = 0; i < (res?.rows?.length ?? 0); i++) {
    const r = res.rows.item(i);
    const id = String(r?.video_id ?? '');
    if (!id) continue;
    const c = Math.max(0, Number(r?.watch_count ?? 0));
    map.set(id, Number.isFinite(c) ? c : 0);
  }
  return map;
};

export const setBlind75WatchCount = async (
  db: any,
  videoId: string,
  watchCount: number,
  table = BLIND75_WATCH_TABLE,
) => {
  const c = Math.max(0, Number(watchCount ?? 0));
  await execSql(
    db,
    `INSERT INTO ${table} (video_id, watch_count, updated_ms)
     VALUES (?, ?, ?)
     ON CONFLICT(video_id) DO UPDATE SET
       watch_count=excluded.watch_count,
       updated_ms=excluded.updated_ms`,
    [String(videoId), c, Date.now()],
  );
};

export const incrementBlind75WatchCount = async (
  db: any,
  videoId: string,
  delta = 1,
  table = BLIND75_WATCH_TABLE,
) => {
  const d = Number(delta ?? 0);
  if (!Number.isFinite(d) || d === 0) return;
  await execSql(
    db,
    `INSERT INTO ${table} (video_id, watch_count, updated_ms)
     VALUES (?, ?, ?)
     ON CONFLICT(video_id) DO UPDATE SET
       watch_count=MAX(0, ${table}.watch_count + excluded.watch_count),
       updated_ms=excluded.updated_ms`,
    [String(videoId), d, Date.now()],
  );
};
