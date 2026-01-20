import React, { useEffect, useMemo, useState } from 'react';

import { useRouter } from 'expo-router';
import { Pressable, ScrollView } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import blind75 from '@/assets/json/blind75.json';
import {
  ensureBlind75WatchTable,
  incrementBlind75WatchCount,
  loadBlind75WatchCounts,
  openAppDb,
} from '@/lib/resetMark';

type Blind75Item = { videoId: string; title: string };

export default function LearnTab2() {
  const router = useRouter();
  const items = useMemo(() => {
    const raw: unknown = blind75;
    return Array.isArray(raw)
      ? (raw.filter(
          (x): x is Blind75Item =>
            Boolean(x) &&
            typeof (x as Blind75Item).videoId === 'string' &&
            (x as Blind75Item).videoId.length > 0 &&
            typeof (x as Blind75Item).title === 'string' &&
            (x as Blind75Item).title.length > 0,
        ) as Blind75Item[])
      : [];
  }, []);

  const db = useMemo(() => openAppDb(), []);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const totalWatchCount = useMemo(
    () => Object.values(counts).reduce((a, b) => a + (Number(b) || 0), 0),
    [counts],
  );

  useEffect(() => {
    const load = async () => {
      try {
        await ensureBlind75WatchTable(db);
        const map = await loadBlind75WatchCounts(db);
        const next: Record<string, number> = {};
        for (const [k, v] of map.entries()) next[k] = v;
        setCounts(next);
      } catch (e) {
        console.log('Failed to load blind75 watch counts (sqlite):', e);
      }
    };
    load();
  }, [db]);

  return (
    <ThemedView style={{ paddingTop: 6, paddingBottom: 8 }}>
      <ThemedView
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <ThemedText type="subtitle">Blind 75</ThemedText>
        <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
          {totalWatchCount} watches
        </ThemedText>
      </ThemedView>

      <ScrollView
        style={{ marginTop: 6 }}
        contentContainerStyle={{ paddingBottom: 8 }}
      >
        {items.map((it, idx) => {
          const label = `#${idx + 1}`;
          const url = `https://www.youtube.com/watch?v=${encodeURIComponent(it.videoId)}`;
          const watchCount = Math.max(0, Number(counts[it.videoId] ?? 0));

          const bump = (delta: number) => {
            setCounts((p) => {
              const cur = Math.max(0, Number(p[it.videoId] ?? 0));
              const nextVal = Math.max(0, cur + delta);
              return { ...p, [it.videoId]: nextVal };
            });
            ensureBlind75WatchTable(db)
              .then(() => incrementBlind75WatchCount(db, it.videoId, delta))
              .catch((e) =>
                console.log(
                  'Failed to persist blind75 watch count (sqlite):',
                  e,
                ),
              );
          };

          return (
            <ThemedView
              key={it.videoId}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingVertical: 6,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(127,127,127,0.18)',
              }}
            >
              <Pressable
                onPress={() => bump(-1)}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: 'rgba(127,127,127,0.28)',
                  backgroundColor: 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                accessibilityRole="button"
              >
                <ThemedText style={{ fontSize: 12, lineHeight: 14 }}>
                  -
                </ThemedText>
              </Pressable>

              <ThemedView style={{ width: 18, alignItems: 'center' }}>
                <ThemedText style={{ fontSize: 11, opacity: 0.85 }}>
                  {watchCount}
                </ThemedText>
              </ThemedView>

              <Pressable
                onPress={() => bump(1)}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: 'rgba(127,127,127,0.28)',
                  backgroundColor: 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                accessibilityRole="button"
              >
                <ThemedText style={{ fontSize: 12, lineHeight: 14 }}>
                  +
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => {
                  bump(1);
                  router.push({
                    pathname: '/webview',
                    params: { url, title: `Blind75 ${label}` },
                  });
                }}
                style={{ flex: 1 }}
                accessibilityRole="link"
              >
                <ThemedText style={{ fontSize: 14 }}>
                  {label} • {it.title}
                </ThemedText>
              </Pressable>
            </ThemedView>
          );
        })}
      </ScrollView>
    </ThemedView>
  );
}
