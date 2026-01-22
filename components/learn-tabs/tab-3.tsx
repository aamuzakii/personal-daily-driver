import React, { useEffect, useMemo, useState } from 'react';

import { Pressable, ScrollView } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import {
  ensureLearnSurahTab3Table,
  loadLearnSurahTab3PressedMs,
  openAppDb,
  setLearnSurahTab3PressedNow,
} from '@/lib/resetMark';

const COLORS_BY_DAY = [
  '#3498DB', // Top fresh (same day)
  '#2ECC71', // Alive (1 day)
  '#F1C40F', // Aging (2 days)
  '#E67E22', // Declining (3 days)
  '#E74C3C', // Dead (4 days)
  '#2C3E50', // Archived (5+ days)
];

const startOfLocalDayMs = (ms: number) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const getAgeColor = (pressedMs: number) => {
  if (!Number.isFinite(pressedMs) || pressedMs <= 0) return undefined;
  const dayDiff = Math.floor(
    (startOfLocalDayMs(Date.now()) - startOfLocalDayMs(pressedMs)) /
      (24 * 60 * 60 * 1000),
  );
  const idx = Math.max(0, Math.min(5, dayDiff));
  return COLORS_BY_DAY[idx];
};

const list = [
  { surah: 46, name: 'Al-Ahqaf' },
  { surah: 47, name: 'Muhammad' },
  { surah: 48, name: 'Al-Fath' },
  { surah: 49, name: 'Al-Hujurat' },
  { surah: 50, name: 'Qaf' },
  { surah: 51, name: 'Adh-Dhariyat' },
  { surah: 52, name: 'At-Tur' },
  { surah: 53, name: 'An-Najm' },
  { surah: 54, name: 'Al-Qamar' },
  { surah: 55, name: 'Ar-Rahman' },
  { surah: 56, name: 'Al-Waqiah' },
  { surah: 57, name: 'Al-Hadid' },
  { surah: 58, name: 'Al-Mujadila' },
  { surah: 59, name: 'Al-Hashr' },
  { surah: 60, name: 'Al-Mumtahanah' },
  { surah: 61, name: 'As-Saff' },
  { surah: 62, name: 'Al-Jumuah' },
  { surah: 63, name: 'Al-Munafiqun' },
  { surah: 64, name: 'At-Taghabun' },
  { surah: 65, name: 'At-Talaq' },
  { surah: 66, name: 'At-Tahrim' },
  { surah: 67, name: 'Al-Mulk' },
  { surah: 68, name: 'Al-Qalam' },
  { surah: 69, name: 'Al-Haqqah' },
  { surah: 70, name: 'Al-Maarij' },
  { surah: 71, name: 'Nuh' },
  { surah: 72, name: 'Al-Jinn' },
  { surah: 73, name: 'Al-Muzzammil' },
  { surah: 74, name: 'Al-Muddathir' },
  { surah: 75, name: 'Al-Qiyamah' },
  { surah: 76, name: 'Al-Insan' },
  { surah: 77, name: 'Al-Mursalat' },
  { surah: 78, name: 'An-Naba' },
  { surah: 79, name: 'An-Naziat' },
  { surah: 80, name: 'Abasa' },
  { surah: 81, name: 'At-Takwir' },
  { surah: 82, name: 'Al-Infitar' },
  { surah: 83, name: 'Al-Mutaffifin' },
  { surah: 84, name: 'Al-Inshiqaq' },
  { surah: 85, name: 'Al-Buruj' },
  { surah: 86, name: 'At-Tariq' },
  { surah: 87, name: 'Al-Ala' },
  { surah: 88, name: 'Al-Ghashiyah' },
  { surah: 89, name: 'Al-Fajr' },
  { surah: 90, name: 'Al-Balad' },
  { surah: 91, name: 'Ash-Shams' },
  { surah: 92, name: 'Al-Lail' },
  { surah: 93, name: 'Ad-Duha' },
  { surah: 94, name: 'Ash-Sharh' },
  { surah: 95, name: 'At-Tin' },
  { surah: 96, name: 'Al-Alaq' },
  { surah: 97, name: 'Al-Qadr' },
  { surah: 98, name: 'Al-Bayyinah' },
  { surah: 99, name: 'Az-Zalzalah' },
  { surah: 100, name: 'Al-Adiyat' },
  { surah: 101, name: 'Al-Qariah' },
  { surah: 102, name: 'At-Takathur' },
  { surah: 103, name: 'Al-Asr' },
  { surah: 104, name: 'Al-Humazah' },
  { surah: 105, name: 'Al-Fil' },
  { surah: 106, name: 'Quraysh' },
  { surah: 107, name: 'Al-Maun' },
  { surah: 108, name: 'Al-Kawthar' },
  { surah: 109, name: 'Al-Kafirun' },
  { surah: 110, name: 'An-Nasr' },
  { surah: 111, name: 'Al-Masad' },
  { surah: 112, name: 'Al-Ikhlas' },
  { surah: 113, name: 'Al-Falaq' },
  { surah: 114, name: 'An-Nas' },
];

export default function LearnTab3() {
  const db = useMemo(() => openAppDb(), []);
  const [pressedMs, setPressedMs] = useState<Record<number, number>>({});

  const doneCount = useMemo(
    () => Object.values(pressedMs).filter((v) => Number(v) > 0).length,
    [pressedMs],
  );

  useEffect(() => {
    let cancelled = false;
    const loadLocal = async () => {
      try {
        await ensureLearnSurahTab3Table(db);
        const map = await loadLearnSurahTab3PressedMs(db);
        const next: Record<number, number> = {};
        for (const [k, v] of map.entries()) next[k] = v;
        if (!cancelled) setPressedMs(next);
      } catch (e) {
        console.log('Failed to load learn tab-3 pressed state (sqlite):', e);
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
        <ThemedText type="subtitle">Surah</ThemedText>
        <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
          {doneCount}/{list.length}
        </ThemedText>
      </ThemedView>

      <ScrollView
        style={{ marginTop: 10 }}
        contentContainerStyle={{ paddingBottom: 18 }}
      >
        {list.map((it) => {
          const ms = Number(pressedMs[it.surah] ?? 0);
          const isPressed = Number.isFinite(ms) && ms > 0;

          const when = isPressed ? new Date(ms).toLocaleString() : '';
          const ageColor = getAgeColor(ms);

          return (
            <ThemedView
              key={String(it.surah)}
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
                onPress={() => {
                  const now = Date.now();
                  setPressedMs((p) => ({ ...p, [it.surah]: now }));
                  ensureLearnSurahTab3Table(db)
                    .then(() => setLearnSurahTab3PressedNow(db, it.surah))
                    .catch((e) =>
                      console.log(
                        'Failed to persist learn tab-3 press (sqlite):',
                        e,
                      ),
                    );
                }}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: isPressed
                    ? 'rgba(80,160,255,0.85)'
                    : 'rgba(127,127,127,0.35)',
                  backgroundColor: isPressed
                    ? 'rgba(80,160,255,0.18)'
                    : 'transparent',
                }}
                accessibilityRole="button"
              >
                <ThemedText style={{ fontSize: 12 }}>
                  {isPressed ? 'Pressed' : 'Press'}
                </ThemedText>
              </Pressable>

              <ThemedView style={{ flex: 1 }}>
                <ThemedText style={{ fontSize: 14, color: ageColor }}>
                  {it.surah}. {it.name}
                </ThemedText>
                {isPressed ? (
                  <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
                    {when}
                  </ThemedText>
                ) : null}
              </ThemedView>
            </ThemedView>
          );
        })}
      </ScrollView>
    </ThemedView>
  );
}
