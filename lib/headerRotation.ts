import { HEADER_IMAGES, HEADER_QUOTES } from '@/constants/headerItems';
import { execSql, openAppDb } from '@/lib/resetMark';

const TABLE_ITEMS = 'header_rotation_items';
const TABLE_STATE = 'header_rotation_state';

type HeaderType = 'image' | 'quote';

const nowMs = () => Date.now();

export const MIN_CHANGE_MS = 1000 * 60 * 60 * 6;

export const ensureHeaderRotationTables = async () => {
  const db = openAppDb();

  await execSql(
    db,
    `CREATE TABLE IF NOT EXISTS ${TABLE_ITEMS} (
      item_key TEXT PRIMARY KEY NOT NULL,
      item_type TEXT NOT NULL,
      display_count INTEGER NOT NULL DEFAULT 0,
      last_shown_ms INTEGER NOT NULL DEFAULT 0
    )`
  );

  await execSql(
    db,
    `CREATE TABLE IF NOT EXISTS ${TABLE_STATE} (
      id INTEGER PRIMARY KEY NOT NULL,
      current_key TEXT,
      last_change_ms INTEGER NOT NULL DEFAULT 0
    )`
  );

  await execSql(db, `INSERT OR IGNORE INTO ${TABLE_STATE} (id, current_key, last_change_ms) VALUES (1, NULL, 0)`);

  const allKeys: { key: string; type: HeaderType }[] = [
    ...HEADER_IMAGES.map((_, idx) => ({ key: `image:${idx}`, type: 'image' as const })),
    ...HEADER_QUOTES.map((_, idx) => ({ key: `quote:${idx}`, type: 'quote' as const })),
  ];

  for (const it of allKeys) {
    await execSql(
      db,
      `INSERT OR IGNORE INTO ${TABLE_ITEMS} (item_key, item_type, display_count, last_shown_ms)
       VALUES (?, ?, 0, 0)`,
      [it.key, it.type]
    );
  }
};

export const getHeaderSelection = async (): Promise<{ type: HeaderType; index: number }> => {
  const db = openAppDb();
  await ensureHeaderRotationTables();

  const stateRes = await execSql(db, `SELECT current_key, last_change_ms FROM ${TABLE_STATE} WHERE id = 1`);
  const stateRow = stateRes?.rows?.length ? stateRes.rows.item(0) : null;

  const currentKey: string | null = stateRow?.current_key ?? null;
  const lastChangeMs: number = Number(stateRow?.last_change_ms ?? 0);

  if (currentKey && nowMs() - lastChangeMs < MIN_CHANGE_MS) {
    const [t, idxStr] = String(currentKey).split(':');
    return { type: t as HeaderType, index: Number(idxStr) };
  }

  const candidatesRes = await execSql(
    db,
    `SELECT item_key, display_count, last_shown_ms
     FROM ${TABLE_ITEMS}
     ORDER BY display_count ASC, last_shown_ms ASC
     LIMIT 8`
  );

  let chosenKey: string | null = null;
  for (let i = 0; i < (candidatesRes?.rows?.length ?? 0); i++) {
    const r = candidatesRes.rows.item(i);
    if (r?.item_key && r.item_key !== currentKey) {
      chosenKey = r.item_key;
      break;
    }
  }

  chosenKey = chosenKey ?? currentKey ?? 'quote:0';

  await execSql(
    db,
    `UPDATE ${TABLE_ITEMS} SET display_count = display_count + 1, last_shown_ms = ? WHERE item_key = ?`,
    [nowMs(), chosenKey]
  );

  await execSql(db, `UPDATE ${TABLE_STATE} SET current_key = ?, last_change_ms = ? WHERE id = 1`, [chosenKey, nowMs()]);

  const [t, idxStr] = String(chosenKey).split(':');
  return { type: t as HeaderType, index: Number(idxStr) };
};
