import React, { useEffect, useMemo, useState } from 'react';

import { useRouter } from 'expo-router';
import { Modal, Pressable, ScrollView } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import umdah from '@/assets/json/umdah.json';

import {
  ensureLearnUmdahTab5Table,
  loadLearnUmdahTab5Labels,
  openAppDb,
  setLearnUmdahTab5Labels,
} from '@/lib/resetMark';

type UmdahItem = { videoId?: unknown; title?: unknown };

export default function LearnTab5() {
  const router = useRouter();
  const items = useMemo(() => {
    const raw: unknown = umdah;
    if (!Array.isArray(raw)) return [] as { videoId: string; title: string }[];

    const out: { videoId: string; title: string }[] = [];
    for (const x of raw as UmdahItem[]) {
      const id = typeof x?.videoId === 'string' ? x.videoId.trim() : '';
      const title = typeof x?.title === 'string' ? x.title.trim() : '';
      if (!id) continue;
      out.push({ videoId: id, title });
    }
    return out;
  }, []);

  const fixedLabels = useMemo(
    () => ['init', 'familiar', 'memorize', 'syarh', 'kajian'] as const,
    [],
  );

  const [labelsByKey, setLabelsByKey] = useState<Record<string, string[]>>({});
  const labeledCount = useMemo(
    () =>
      Object.values(labelsByKey).filter((xs) => (xs?.length ?? 0) > 0).length,
    [labelsByKey],
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [activeKey, setActiveKey] = useState('');
  const [activeTitle, setActiveTitle] = useState('');

  const db = useMemo(() => openAppDb(), []);

  useEffect(() => {
    let cancelled = false;
    const loadLocal = async () => {
      try {
        await ensureLearnUmdahTab5Table(db);
        const map = await loadLearnUmdahTab5Labels(db);
        const next: Record<string, string[]> = {};
        for (const [k, v] of map.entries()) next[k] = v;
        if (!cancelled) setLabelsByKey(next);
      } catch (e) {
        console.log('Failed to load learn tab-5 labels state (sqlite):', e);
      }
    };
    loadLocal();
    return () => {
      cancelled = true;
    };
  }, [db]);

  const openLabelModal = (itemKey: string, title: string) => {
    setActiveKey(itemKey);
    setActiveTitle(title);
    setModalVisible(true);
  };

  const toYmd = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const isDateLabel = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

  const toggleLabel = (itemKey: string, label: string) => {
    const k = String(itemKey ?? '');
    const lbl = String(label ?? '').trim();
    if (!k || !lbl) return;

    setLabelsByKey((p) => {
      const prev = Array.isArray(p[k]) ? p[k] : [];
      const exists = prev.includes(lbl);
      const next = exists ? prev.filter((x) => x !== lbl) : [...prev, lbl];

      ensureLearnUmdahTab5Table(db)
        .then(() => setLearnUmdahTab5Labels(db, k, next))
        .catch((e) =>
          console.log('Failed to persist learn tab-5 labels (sqlite):', e),
        );

      return { ...p, [k]: next };
    });
  };

  const setDateLabel = (daysDelta: number) => {
    const k = String(activeKey ?? '');
    if (!k) return;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + Number(daysDelta));
    const dateLabel = toYmd(d);

    setLabelsByKey((p) => {
      const prev = Array.isArray(p[k]) ? p[k] : [];
      const prevDate = prev.find(
        (x) => typeof x === 'string' && isDateLabel(x),
      );
      const withoutDates = prev.filter(
        (x) => !(typeof x === 'string' && isDateLabel(x)),
      );

      const next =
        prevDate === dateLabel ? withoutDates : [...withoutDates, dateLabel];

      ensureLearnUmdahTab5Table(db)
        .then(() => setLearnUmdahTab5Labels(db, k, next))
        .catch((e) =>
          console.log('Failed to persist learn tab-5 labels (sqlite):', e),
        );

      return { ...p, [k]: next };
    });
  };

  return (
    <ThemedView style={{ paddingTop: 12, paddingBottom: 16 }}>
      <ThemedView
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <ThemedText type="subtitle">Umdah</ThemedText>
        <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
          {labeledCount}/{items.length}
        </ThemedText>
      </ThemedView>

      <ScrollView
        style={{ marginTop: 10 }}
        contentContainerStyle={{ paddingBottom: 18 }}
      >
        {items.map((it) => {
          const id = it.videoId;
          const title = it.title || id;
          const itemKey = `${id}::${title}`;
          const labels = labelsByKey[itemKey] ?? [];
          const url = `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;

          return (
            <ThemedView
              key={itemKey}
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
                onPress={() => openLabelModal(itemKey, title)}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor:
                    labels.length > 0
                      ? 'rgba(127,127,127,0.45)'
                      : 'rgba(127,127,127,0.28)',
                  backgroundColor:
                    labels.length > 0
                      ? 'rgba(127,127,127,0.18)'
                      : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                accessibilityRole="button"
              >
                <ThemedText style={{ fontSize: 13 }}>
                  {labels.length > 0 ? 'E' : '+'}
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/webview',
                    params: {
                      url,
                      title: `Umdah ${title}`,
                    },
                  })
                }
                style={{ flex: 1 }}
                accessibilityRole="link"
              >
                <ThemedText
                  style={{ fontSize: 14, textDecorationLine: 'underline' }}
                >
                  {title}
                </ThemedText>
                {labels.length > 0 ? (
                  <ThemedText
                    style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}
                  >
                    {labels.join(' • ')}
                  </ThemedText>
                ) : null}
              </Pressable>
            </ThemedView>
          );
        })}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          onPress={() => setModalVisible(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              marginTop: 120,
              marginHorizontal: 16,
              borderRadius: 14,
              padding: 14,
              backgroundColor: 'rgba(30,30,30,0.96)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.12)',
            }}
          >
            <ThemedText type="subtitle">Labels</ThemedText>
            <ThemedText style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
              {activeTitle}
            </ThemedText>

            {(labelsByKey[activeKey] ?? []).filter(
              (x) =>
                typeof x === 'string' &&
                x.length > 0 &&
                !(fixedLabels as readonly string[]).includes(x),
            ).length > 0 ? (
              <ThemedView style={{ marginTop: 12 }}>
                <ThemedText
                  style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}
                >
                  Custom labels (tap to remove)
                </ThemedText>
                <ThemedView
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 10,
                  }}
                >
                  {(labelsByKey[activeKey] ?? [])
                    .filter(
                      (x) =>
                        typeof x === 'string' &&
                        x.length > 0 &&
                        !(fixedLabels as readonly string[]).includes(x),
                    )
                    .map((lbl) => (
                      <Pressable
                        key={lbl}
                        onPress={() => toggleLabel(activeKey, lbl)}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 8,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: 'rgba(255,255,255,0.35)',
                          backgroundColor: 'rgba(255,255,255,0.12)',
                        }}
                      >
                        <ThemedText style={{ fontSize: 12 }}>{lbl}</ThemedText>
                      </Pressable>
                    ))}
                </ThemedView>
              </ThemedView>
            ) : null}

            <ThemedView
              style={{
                marginTop: 12,
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              {fixedLabels.map((lbl) => {
                const selected = (labelsByKey[activeKey] ?? []).includes(lbl);
                return (
                  <Pressable
                    key={lbl}
                    onPress={() => toggleLabel(activeKey, lbl)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: selected
                        ? 'rgba(255,255,255,0.35)'
                        : 'rgba(255,255,255,0.18)',
                      backgroundColor: selected
                        ? 'rgba(255,255,255,0.12)'
                        : 'rgba(255,255,255,0.06)',
                    }}
                  >
                    <ThemedText style={{ fontSize: 12 }}>{lbl}</ThemedText>
                  </Pressable>
                );
              })}
            </ThemedView>

            <ThemedView style={{ marginTop: 14 }}>
              <ThemedText
                style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}
              >
                Date
              </ThemedText>
              <ThemedView
                style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}
              >
                <Pressable
                  onPress={() => setDateLabel(1)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.18)',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                  }}
                >
                  <ThemedText style={{ fontSize: 12 }}>tomorrow</ThemedText>
                </Pressable>

                <Pressable
                  onPress={() => setDateLabel(3)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.18)',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                  }}
                >
                  <ThemedText style={{ fontSize: 12 }}>3 days later</ThemedText>
                </Pressable>

                <Pressable
                  onPress={() => setDateLabel(7)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.18)',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                  }}
                >
                  <ThemedText style={{ fontSize: 12 }}>next week</ThemedText>
                </Pressable>

                <Pressable
                  onPress={() => setDateLabel(30)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.18)',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                  }}
                >
                  <ThemedText style={{ fontSize: 12 }}>next month</ThemedText>
                </Pressable>
              </ThemedView>
            </ThemedView>

            <ThemedView
              style={{
                marginTop: 14,
                flexDirection: 'row',
                justifyContent: 'flex-end',
              }}
            >
              <Pressable
                onPress={() => setModalVisible(false)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.18)',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <ThemedText style={{ fontSize: 12 }}>Close</ThemedText>
              </Pressable>
            </ThemedView>
          </Pressable>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}
