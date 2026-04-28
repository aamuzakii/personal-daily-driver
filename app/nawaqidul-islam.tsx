import React, { useEffect, useMemo, useState } from 'react';

import { useRouter } from 'expo-router';
import { Pressable, ScrollView, TextInput } from 'react-native';

import nawaqidul from '@/assets/json/nawaqidul-islam.json';
import ItemActionsModal from '@/components/item-actions-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  ensureLearnNawaqidTable,
  loadLearnNawaqidProgress,
  openAppDb,
  setLearnNawaqidDisplayedTitle,
  setLearnNawaqidProgress,
} from '@/lib/resetMark';

// helpers to parse and format duration strings like "1:27:08" or "57:17"
function parseDurationToSeconds(d?: string) {
  if (!d || typeof d !== 'string') return 0;
  const parts = d.split(':').map((p) => Number(p.replace(/[^0-9]/g, '') || 0));
  if (parts.length === 0) return 0;
  // support H:MM:SS or MM:SS or SS
  let seconds = 0;
  if (parts.length === 3) {
    seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    seconds = parts[0] * 60 + parts[1];
  } else {
    seconds = parts[0];
  }
  return Number.isFinite(seconds) ? Math.max(0, Math.round(seconds)) : 0;
}

function formatSecondsToHMS(s: number) {
  const sec = Math.max(0, Math.round(Number(s) || 0));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const ss = sec % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  return `${m}:${String(ss).padStart(2, '0')}`;
}

// Local per-item component to manage progress (avoids calling hooks inside map)
function LearnItem({
  item,
  itemKey,
}: {
  item: { title: string; url: string; duration?: string };
  itemKey: string;
}) {
  const router = useRouter();
  const [progress, setProgress] = useState<number>(0);
  const [editing, setEditing] = useState(false);
  const [displayedTitle, setDisplayedTitle] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [sliderEditable, setSliderEditable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const db = openAppDb();
    (async () => {
      try {
        await ensureLearnNawaqidTable(db);
        const map = await loadLearnNawaqidProgress(db);
        if (!cancelled) setProgress(map.get(itemKey) ?? 0);
        // load displayed title if any
        try {
          const { loadLearnNawaqidDisplayedTitle } =
            await import('@/lib/resetMark');
          const dt = await loadLearnNawaqidDisplayedTitle(db, itemKey);
          if (!cancelled && dt) setDisplayedTitle(dt ?? null);
        } catch (e) {
          // optional
        }
      } catch (_e) {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [itemKey]);

  const changeProgress = (next: number) => {
    const p = Math.max(0, Math.min(100, Math.round(next)));
    setProgress(p);
    const db = openAppDb();
    setLearnNawaqidProgress(db, itemKey, p).catch(() => {});
  };

  // clickable title only — slider is separate so dragging it won't open the video
  const [trackWidth, setTrackWidth] = useState<number>(0);

  const onStartOrMove = (clientX: number, pageX: number) => {
    // clientX / pageX may vary across platforms; prefer locationX if available via responder
    // but here we'll compute relative if trackWidth known.
    if (trackWidth <= 0) return;
    // clientX is expected to be the x inside the track
    const x = Math.max(0, Math.min(trackWidth, clientX));
    const pct = Math.round((x / trackWidth) * 100);
    setProgress(pct);
  };

  const onRelease = (clientX: number) => {
    if (trackWidth <= 0) return;
    const x = Math.max(0, Math.min(trackWidth, clientX));
    const pct = Math.round((x / trackWidth) * 100);
    const db = openAppDb();
    setLearnNawaqidProgress(db, itemKey, pct).catch(() => {});
    setProgress(pct);
  };

  const totalSeconds = useMemo(
    () => parseDurationToSeconds(item.duration),
    [item.duration],
  );
  const watchedSeconds = useMemo(
    () => Math.round((totalSeconds * (progress ?? 0)) / 100),
    [totalSeconds, progress],
  );

  return (
    <ThemedView style={{ flex: 1 }}>
      <ThemedView style={{ flexDirection: 'row', alignItems: 'center' }}>
        {!editing ? (
          <>
            <Pressable
              onPress={() => setModalVisible(true)}
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: 'rgba(127,127,127,0.28)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8,
              }}
              accessibilityRole="button"
            >
              <ThemedText style={{ fontSize: 13 }}>+</ThemedText>
            </Pressable>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/webview',
                  params: {
                    url: item.url,
                    title: `Nawaqidul Islam • ${item.title}`,
                  },
                })
              }
              style={{ flex: 1 }}
            >
              <ThemedText
                style={{ fontSize: 14, textDecorationLine: 'underline' }}
                numberOfLines={2}
              >
                {displayedTitle ?? item.title}
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={() => setEditing(true)}
              style={{ padding: 8, marginLeft: 8, alignSelf: 'flex-start' }}
              accessibilityLabel="Edit title"
            >
              <ThemedText style={{ opacity: 0.9, fontSize: 14 }}>✎</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setSliderEditable((s) => !s)}
              style={{ padding: 8, marginLeft: 6, alignSelf: 'flex-start' }}
              accessibilityLabel={
                sliderEditable
                  ? 'Lock progress slider'
                  : 'Unlock progress slider'
              }
            >
              <ThemedText style={{ opacity: 0.85, fontSize: 14 }}>
                {sliderEditable ? '🔓' : '🔒'}
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/nawaqidul-islam/note',
                  params: { itemKey },
                })
              }
              style={{ padding: 8, marginLeft: 4, alignSelf: 'flex-start' }}
              accessibilityLabel="Open note"
            >
              <ThemedText style={{ opacity: 0.9, fontSize: 14 }}>📝</ThemedText>
            </Pressable>

            {/* Modal for plus actions (reset progress) - extracted component */}
            <ItemActionsModal
              visible={modalVisible}
              onClose={() => setModalVisible(false)}
              onResetZero={() => changeProgress(0)}
              onSetHundred={() => changeProgress(100)}
            />
          </>
        ) : (
          <TextInput
            autoFocus
            value={displayedTitle ?? item.title}
            onChangeText={(t) => setDisplayedTitle(String(t ?? ''))}
            onBlur={async () => {
              setEditing(false);
              try {
                const db2 = openAppDb();
                await setLearnNawaqidDisplayedTitle(
                  db2,
                  itemKey,
                  displayedTitle ?? '',
                );
              } catch (e) {
                console.log('Failed to persist displayed title', e);
              }
            }}
            style={{ fontSize: 14, padding: 4, flex: 1 }}
            placeholder={item.title}
          />
        )}
      </ThemedView>

      {item.duration ? (
        <ThemedView>
          <ThemedView
            style={{ marginTop: 8, opacity: sliderEditable ? 1 : 0.76 }}
            onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
            onStartShouldSetResponder={() => !!sliderEditable}
            onResponderGrant={(e) => {
              if (!sliderEditable) return;
              const locX = e.nativeEvent.locationX;
              onStartOrMove(locX, e.nativeEvent.pageX);
            }}
            onResponderMove={(e) => {
              if (!sliderEditable) return;
              const locX = e.nativeEvent.locationX;
              onStartOrMove(locX, e.nativeEvent.pageX);
            }}
            onResponderRelease={(e) => {
              if (!sliderEditable) return;
              const locX = e.nativeEvent.locationX;
              onRelease(locX);
            }}
          >
            <ThemedView
              style={{
                height: 8,
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderRadius: 6,
                overflow: 'hidden',
              }}
            >
              <ThemedView
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: 'rgba(10,126,164,0.9)',
                }}
              />
            </ThemedView>

            <ThemedView
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 8,
              }}
            >
              <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                {formatSecondsToHMS(watchedSeconds)} watched
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      ) : null}
    </ThemedView>
  );
}

export default function NawaqidulIslamScreen() {
  const router = useRouter();

  const items = useMemo(() => {
    const raw: unknown = nawaqidul;
    if (!Array.isArray(raw))
      return [] as { title: string; url: string; duration?: string }[];

    return (raw as any[])
      .map((x) => ({
        title:
          typeof x?.title === 'string'
            ? x.title.trim()
            : String(x?.title ?? ''),
        url: typeof x?.url === 'string' ? x.url.trim() : String(x?.url ?? ''),
        duration:
          typeof x?.duration === 'string' ? x.duration.trim() : undefined,
      }))
      .filter((it) => it.url.length > 0 && it.title.length > 0);
  }, []);

  return (
    <ThemedView style={{ paddingTop: 12, paddingBottom: 16 }}>
      <ThemedView
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 10,
        }}
      >
        <ThemedText type="subtitle">Nawaqidul Islam</ThemedText>
        <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
          {items.length}
        </ThemedText>
      </ThemedView>

      <ScrollView
        style={{ marginTop: 10 }}
        contentContainerStyle={{ paddingBottom: 18 }}
      >
        {items.map((it) => {
          const itemKey = `${it.url}::${it.title}`;
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
                paddingHorizontal: 10,
              }}
            >
              <LearnItem item={it} itemKey={itemKey} />
            </ThemedView>
          );
        })}
      </ScrollView>
    </ThemedView>
  );
}
