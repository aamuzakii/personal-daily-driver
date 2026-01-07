import { styles } from '@/constants/styles';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

function clamp01(n: number) {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

    type UserApiResponse = {
  name: string;
  weeklyMinutes: number;
  obligationMinutes: number;
};

function TwoSlicePie({
  size,
  ratio,
  colorA,
  colorB,
}: {
  size: number;
  ratio: number;
  colorA: string;
  colorB: string;
}) {
  const r = clamp01(ratio);
  const angle = r * 360;
  const isOverHalf = angle > 180;
  const rightRotation = isOverHalf ? 180 : angle;
  const leftRotation = isOverHalf ? angle - 180 : 0;

  const half = size / 2;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colorB,
        overflow: 'hidden',
      }}>
      <View
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: half,
          height: size,
          overflow: 'hidden',
        }}>
        <View
          style={{
            position: 'absolute',
            left: -half,
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colorA,
            transform: [{ rotateZ: `${rightRotation}deg` }],
          }}
        />
      </View>

      {isOverHalf && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: half,
            height: size,
            overflow: 'hidden',
          }}>
          <View
            style={{
              position: 'absolute',
              left: 0,
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: colorA,
              transform: [{ rotateZ: `${leftRotation}deg` }],
            }}
          />
        </View>
      )}
    </View>
  );
}

function Pie() {
  const [data, setData] = useState<UserApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('https://home-dashboard-lac.vercel.app/api/user');
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }
        const json = (await res.json()) as UserApiResponse;
        if (!cancelled) setData(json);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load user');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const weekly = data?.weeklyMinutes ?? 0;
  const obligation = data?.obligationMinutes ?? 0;
  const total = weekly + obligation;
  const ratio = total > 0 ? weekly / total : 0;

  return (
    <ThemedView style={styles.stepContainer}>
      <ThemedText type="subtitle">Gimana Mau Nambah Satu Permanent Role Kalau ...</ThemedText>

      {loading && <ActivityIndicator style={{ marginTop: 8 }} />}

      {!!error && (
        <ThemedText style={{ color: 'red', marginTop: 8 }}>Error: {error}</ThemedText>
      )}

      {!!data && !loading && !error && (
        <ThemedView style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <TwoSlicePie size={110} ratio={ratio} colorA="#0a7ea4" colorB="#f97316" />

          <ThemedView style={{ flex: 1 }}>
            <ThemedText type="defaultSemiBold">{data.name}</ThemedText>
            <ThemedText style={{ marginTop: 6 }}>Weekly: {weekly} min</ThemedText>
            <ThemedText>Remaining: {obligation} min</ThemedText>
          </ThemedView>
        </ThemedView>
      )}
    </ThemedView>
  );
}

export default Pie