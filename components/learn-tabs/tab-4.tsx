import React, { useEffect, useMemo, useState } from 'react';

import { Pressable, ScrollView } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import {
  ensureLearnAkmilTab4Table,
  loadLearnAkmilTab4Done,
  openAppDb,
  setLearnAkmilTab4Done,
} from '@/lib/resetMark';

const akmil = {
  tes_fisik_akmil: {
    'Lari 12 Menit (Meter)': {
      bagus: { min: 3200 },
      aman: { min: 3000, max: 3199 },
      rawan: { min: 2800, max: 2999 },
      gugur: { max: 2799 },
    },

    'Pull Up (Repetisi)': {
      bagus: { min: 12 },
      aman: { min: 8, max: 11 },
      rawan: { min: 4, max: 7 },
      gugur: { max: 3 },
    },

    'Sit Up 1 Menit (Repetisi)': {
      bagus: { min: 40 },
      aman: { min: 30, max: 39 },
      rawan: { min: 20, max: 29 },
      gugur: { max: 19 },
    },

    'Push Up 1 Menit (Repetisi)': {
      bagus: { min: 45 },
      aman: { min: 35, max: 44 },
      rawan: { min: 25, max: 34 },
      gugur: { max: 24 },
    },

    'Shuttle Run (Detik)': {
      bagus: { max: 16 },
      aman: { min: 16.1, max: 18 },
      rawan: { min: 18.1, max: 20 },
      gugur: { min: 20.1 },
    },

    'Renang (Meter)': {
      bagus: { min: 50 },
      aman: { min: 25, max: 49 },
      gugur: { note: 'tidak bisa berenang atau berhenti di tengah' },
    },
  },
};

export default function LearnTab4() {
  const db = useMemo(() => openAppDb(), []);
  const [done, setDone] = useState<Record<string, boolean>>({});

  const items = useMemo(() => {
    const raw: any = akmil?.tes_fisik_akmil ?? {};
    const out: { key: string; min: number }[] = [];

    for (const k of Object.keys(raw)) {
      const min = raw?.[k]?.rawan?.min;
      if (typeof min === 'number' && Number.isFinite(min)) {
        out.push({ key: k, min });
      }
    }

    return out;
  }, []);

  const doneCount = useMemo(
    () => Object.values(done).filter(Boolean).length,
    [done],
  );

  useEffect(() => {
    let cancelled = false;
    const loadLocal = async () => {
      try {
        await ensureLearnAkmilTab4Table(db);
        const map = await loadLearnAkmilTab4Done(db);
        const next: Record<string, boolean> = {};
        for (const [k, v] of map.entries()) next[k] = v;
        if (!cancelled) setDone(next);
      } catch (e) {
        console.log('Failed to load learn tab-4 done state (sqlite):', e);
      }
    };
    loadLocal();
    return () => {
      cancelled = true;
    };
  }, [db]);

  return (
    <ThemedView style={{ paddingTop: 12, paddingBottom: 16 }}>
      <ThemedView
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <ThemedText type="subtitle">Akmil • Rawan Min</ThemedText>
        <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
          {doneCount}/{items.length}
        </ThemedText>
      </ThemedView>

      <ScrollView
        style={{ marginTop: 10 }}
        contentContainerStyle={{ paddingBottom: 18 }}
      >
        {items.map((it) => {
          const checked = Boolean(done[it.key]);

          return (
            <ThemedView
              key={it.key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(127,127,127,0.18)',
              }}
            >
              <Pressable
                onPress={() =>
                  setDone((p) => {
                    const nextVal = !p[it.key];
                    const next = { ...p, [it.key]: nextVal };
                    ensureLearnAkmilTab4Table(db)
                      .then(() => setLearnAkmilTab4Done(db, it.key, nextVal))
                      .catch((e) =>
                        console.log(
                          'Failed to persist learn tab-4 tick (sqlite):',
                          e,
                        ),
                      );
                    return next;
                  })
                }
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: checked
                    ? 'rgba(127,127,127,0.45)'
                    : 'rgba(127,127,127,0.28)',
                  backgroundColor: checked
                    ? 'rgba(127,127,127,0.18)'
                    : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                accessibilityRole="button"
              >
                <ThemedText style={{ fontSize: 13 }}>
                  {checked ? '✓' : ''}
                </ThemedText>
              </Pressable>

              <ThemedView style={{ flex: 1 }}>
                <ThemedText style={{ fontSize: 14 }}>{it.key}</ThemedText>
              </ThemedView>

              <ThemedText style={{ fontSize: 14, opacity: 0.85 }}>
                {it.min}
              </ThemedText>
            </ThemedView>
          );
        })}
      </ScrollView>
    </ThemedView>
  );
}
