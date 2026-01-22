import React, { useEffect, useMemo, useState } from 'react';

import { useRouter } from 'expo-router';
import { Pressable, ScrollView } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import riyadTab1 from '@/assets/json/riyad-tab-1.json';

import {
  ensureLearnRiyadTab1Table,
  loadLearnRiyadTab1Done,
  openAppDb,
  setLearnRiyadTab1Done,
} from '@/lib/resetMark';

export default function LearnTab1() {
  const router = useRouter();
  const ids = useMemo(() => {
    const raw: unknown = riyadTab1;
    return Array.isArray(raw)
      ? (raw.filter((x) => typeof x === 'string' && x.length > 0) as string[])
      : [];
  }, []);

  const [done, setDone] = useState<Record<string, boolean>>({});
  const doneCount = useMemo(
    () => Object.values(done).filter(Boolean).length,
    [done],
  );

  const db = useMemo(() => openAppDb(), []);

  useEffect(() => {
    let cancelled = false;
    const loadLocal = async () => {
      try {
        await ensureLearnRiyadTab1Table(db);
        const map = await loadLearnRiyadTab1Done(db);
        const next: Record<string, boolean> = {};
        for (const [k, v] of map.entries()) next[k] = v;
        if (!cancelled) setDone(next);
      } catch (e) {
        console.log('Failed to load learn tab-1 done state (sqlite):', e);
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
        <ThemedText type="subtitle">Riyadussalihen</ThemedText>
        <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
          {doneCount}/{ids.length}
        </ThemedText>
      </ThemedView>

      <ScrollView
        style={{ marginTop: 10 }}
        contentContainerStyle={{ paddingBottom: 18 }}
      >
        {ids.map((id, idx) => {
          const checked = Boolean(done[id]);
          const label = `#${idx + 1}`;
          const url = `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;

          return (
            <ThemedView
              key={id}
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
                    const nextVal = !p[id];
                    const next = { ...p, [id]: nextVal };
                    ensureLearnRiyadTab1Table(db)
                      .then(() => setLearnRiyadTab1Done(db, id, nextVal))
                      .catch((e) =>
                        console.log(
                          'Failed to persist learn tab-1 tick (sqlite):',
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

              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/webview',
                    params: { url, title: `Riyad ${label}` },
                  })
                }
                style={{ flex: 1 }}
                accessibilityRole="link"
              >
                <ThemedText
                  style={{ fontSize: 14, textDecorationLine: 'underline' }}
                >
                  {label} • {id}
                </ThemedText>
              </Pressable>
            </ThemedView>
          );
        })}
      </ScrollView>
    </ThemedView>
  );
}
