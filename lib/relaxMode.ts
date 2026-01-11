import { execSql, openAppDb, toYmd } from '@/lib/resetMark';

const TABLE = 'relax_mode_daily';
export const MAX_RELAX_MS_PER_DAY = 60 * 60 * 1000;
export const RELAX_CHUNK_MS = 15 * 60 * 1000;

type RelaxRow = {
  day: string;
  used_ms: number;
  active_since_ms: number | null;
};

const nowMs = () => Date.now();

const ensureTable = async (db: any) => {
  await execSql(
    db,
    `CREATE TABLE IF NOT EXISTS ${TABLE} (
      day TEXT PRIMARY KEY NOT NULL,
      used_ms INTEGER NOT NULL DEFAULT 0,
      active_since_ms INTEGER
    )`
  );
};

const ensureTodayRow = async (db: any, day: string) => {
  await execSql(db, `INSERT OR IGNORE INTO ${TABLE} (day, used_ms, active_since_ms) VALUES (?, 0, NULL)`, [day]);
};

const getRow = async (db: any, day: string): Promise<RelaxRow> => {
  const res = await execSql(db, `SELECT day, used_ms, active_since_ms FROM ${TABLE} WHERE day = ? LIMIT 1`, [day]);
  if (res?.rows?.length) {
    const r = res.rows.item(0);
    return {
      day: String(r.day),
      used_ms: Number(r.used_ms ?? 0) || 0,
      active_since_ms: r.active_since_ms === null || r.active_since_ms === undefined ? null : Number(r.active_since_ms),
    };
  }
  return { day, used_ms: 0, active_since_ms: null };
};

export const getRelaxState = async () => {
  const db = openAppDb();
  const day = toYmd(new Date());
  await ensureTable(db);
  await ensureTodayRow(db, day);

  const row = await getRow(db, day);
  const additional = row.active_since_ms ? Math.max(0, nowMs() - row.active_since_ms) : 0;
  const used = row.used_ms + additional;
  const remaining = Math.max(0, MAX_RELAX_MS_PER_DAY - used);
  const chunkElapsed = row.active_since_ms ? additional : 0;
  const chunkRemaining = row.active_since_ms
    ? Math.max(0, Math.min(remaining, Math.max(0, RELAX_CHUNK_MS - chunkElapsed)))
    : 0;

  return {
    day,
    isRelaxing: !!row.active_since_ms && chunkRemaining > 0 && remaining > 0,
    usedMs: used,
    remainingMs: remaining,
    chunkRemainingMs: chunkRemaining,
  };
};

export const startRelax = async () => {
  const db = openAppDb();
  const day = toYmd(new Date());
  await ensureTable(db);
  await ensureTodayRow(db, day);

  const row = await getRow(db, day);
  if (row.active_since_ms) {
    return getRelaxState();
  }

  const state = await getRelaxState();
  if (state.remainingMs <= 0) return state;

  await execSql(db, `UPDATE ${TABLE} SET active_since_ms = ? WHERE day = ?`, [nowMs(), day]);
  return getRelaxState();
};

export const stopRelax = async () => {
  const db = openAppDb();
  const day = toYmd(new Date());
  await ensureTable(db);
  await ensureTodayRow(db, day);

  const row = await getRow(db, day);
  if (!row.active_since_ms) {
    return getRelaxState();
  }

  const delta = Math.max(0, nowMs() - row.active_since_ms);
  await execSql(
    db,
    `UPDATE ${TABLE} SET used_ms = used_ms + ?, active_since_ms = NULL WHERE day = ?`,
    [delta, day]
  );

  return getRelaxState();
};

export const tickRelax = async () => {
  const state = await getRelaxState();
  if (!state.isRelaxing) {
    if (state.chunkRemainingMs <= 0) {
      const db = openAppDb();
      const day = toYmd(new Date());
      await ensureTable(db);
      await ensureTodayRow(db, day);
      const row = await getRow(db, day);
      if (row.active_since_ms) {
        await stopRelax();
        return getRelaxState();
      }
    }
    return state;
  }

  if (state.remainingMs <= 0 || state.chunkRemainingMs <= 0) {
    await stopRelax();
    return getRelaxState();
  }

  return state;
};
