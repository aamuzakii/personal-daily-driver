import React, { useMemo, useState } from 'react';

import { useRouter } from 'expo-router';
import { Pressable, ScrollView } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import blind75 from '@/app/(tabs)/blind75.json';

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
            (x as Blind75Item).title.length > 0
        ) as Blind75Item[])
      : [];
  }, []);

  const [done, setDone] = useState<Record<string, boolean>>({});
  const doneCount = useMemo(() => Object.values(done).filter(Boolean).length, [done]);

  return (
    <ThemedView style={{ paddingTop: 12, paddingBottom: 16 }}>
      <ThemedView
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <ThemedText type="subtitle">Blind 75</ThemedText>
        <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
          {doneCount}/{items.length}
        </ThemedText>
      </ThemedView>

      <ScrollView style={{ marginTop: 10 }} contentContainerStyle={{ paddingBottom: 18 }}>
        {items.map((it, idx) => {
          const checked = Boolean(done[it.videoId]);
          const label = `#${idx + 1}`;
          const url = `https://www.youtube.com/watch?v=${encodeURIComponent(it.videoId)}`;

          return (
            <ThemedView
              key={it.videoId}
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
                onPress={() => setDone((p) => ({ ...p, [it.videoId]: !p[it.videoId] }))}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: checked ? 'rgba(127,127,127,0.45)' : 'rgba(127,127,127,0.28)',
                  backgroundColor: checked ? 'rgba(127,127,127,0.18)' : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                accessibilityRole="button"
              >
                <ThemedText style={{ fontSize: 13 }}>{checked ? '✓' : ''}</ThemedText>
              </Pressable>

              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/webview',
                    params: { url, title: `Blind75 ${label}` },
                  })
                }
                style={{ flex: 1 }}
                accessibilityRole="link"
              >
                <ThemedText style={{ fontSize: 14, textDecorationLine: 'underline' }}>
                  {label} • {it.title}
                </ThemedText>
                <ThemedText style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>
                  {it.videoId}
                </ThemedText>
              </Pressable>
            </ThemedView>
          );
        })}
      </ScrollView>
    </ThemedView>
  );
}
