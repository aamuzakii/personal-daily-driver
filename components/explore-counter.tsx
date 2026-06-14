import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Modal, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import { execSql } from '@/lib/resetMark';

type Props = {
  db: any;
  items: string[];
  resetNonce: number;
};

const EXPLORE_COUNTER_TABLE = 'explore_counter';

export default function ExploreCounter({ db, items, resetNonce }: Props) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [modalKey, setModalKey] = useState<string | null>(null);
  const prevResetNonce = useRef<number>(resetNonce);

  const normalizedItems = useMemo(
    () => items.filter((x) => typeof x === 'string' && x.trim().length > 0),
    [items],
  );

  const ensureTable = async () => {
    await execSql(
      db,
      `CREATE TABLE IF NOT EXISTS ${EXPLORE_COUNTER_TABLE} (
        counter_key TEXT PRIMARY KEY NOT NULL,
        count INTEGER NOT NULL
      )`,
    );
  };

  const loadAll = async () => {
    await ensureTable();
    const res = await execSql(
      db,
      `SELECT counter_key, count FROM ${EXPLORE_COUNTER_TABLE}`,
    );
    const next: Record<string, number> = {};
    for (let i = 0; i < (res?.rows?.length ?? 0); i++) {
      const r = res.rows.item(i);
      const k = String(r?.counter_key ?? '');
      if (!k) continue;
      const c = Math.max(0, Number(r?.count ?? 0));
      next[k] = Number.isFinite(c) ? c : 0;
    }
    setCounts(next);
  };

  const resetAll = async () => {
    await ensureTable();
    await execSql(db, `DELETE FROM ${EXPLORE_COUNTER_TABLE}`);
    setCounts({});
  };

  const upsertCount = async (key: string, count: number) => {
    const k = String(key ?? '');
    if (!k) return;
    const c = Math.max(0, Number(count ?? 0));

    await ensureTable();
    await execSql(
      db,
      `INSERT INTO ${EXPLORE_COUNTER_TABLE} (counter_key, count)
       VALUES (?, ?)
       ON CONFLICT(counter_key) DO UPDATE SET count=excluded.count`,
      [k, c],
    );
  };

  const incrementForKey = (key: string) => {
    setCounts((p) => {
      const nextVal = (p[key] ?? 0) + 1;
      const next = { ...p, [key]: nextVal };
      upsertCount(key, nextVal).catch((e) =>
        console.log('Failed to persist explore counter (sqlite):', e),
      );
      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const didReset = prevResetNonce.current !== resetNonce;
        prevResetNonce.current = resetNonce;

        if (didReset) {
          await resetAll();
          return;
        }

        await loadAll();
      } catch (e) {
        if (!cancelled)
          console.log('Failed to load explore counters (sqlite):', e);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [db, resetNonce]);

  if (normalizedItems.length === 0) return null;

  return (
    <ThemedView style={{ marginBottom: 14 }}>
      <ThemedView style={{ marginTop: 10, gap: 10 }}>
        {normalizedItems.map((k) => {
          const c = counts[k] ?? 0;
          return (
            <ThemedView
              key={k}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <ThemedView style={{ flex: 1 }}>
                <ThemedText style={{ fontSize: 14 }}>
                  {k}: {c} / 100
                </ThemedText>
              </ThemedView>

              <Pressable
                onPress={() => {
                  // open modal so user can press a larger + button
                  setModalKey(k);
                }}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(127,127,127,0.25)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                accessibilityRole="button"
              >
                <ThemedText style={{ fontSize: 18, lineHeight: 18 }}>
                  +
                </ThemedText>
              </Pressable>
            </ThemedView>
          );
        })}
      </ThemedView>

      {/* Modal for big + button */}
      <Modal
        visible={modalKey != null}
        transparent
        animationType="fade"
        onRequestClose={() => setModalKey(null)}
      >
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={styles.modalBox}>
            <Pressable
              onPress={() => setModalKey(null)}
              style={styles.closeButton}
              accessibilityRole="button"
            >
              <ThemedText style={{ fontSize: 20 }}>×</ThemedText>
            </Pressable>

            <Pressable
              onPress={() => {
                if (modalKey) incrementForKey(modalKey);
              }}
              style={styles.bigButton}
              accessibilityRole="button"
            >
              <ThemedText style={{ fontSize: 48, lineHeight: 48 }}>
                +
              </ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: {
    width: 260,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.98)',
  },
  bigButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(127,127,127,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
