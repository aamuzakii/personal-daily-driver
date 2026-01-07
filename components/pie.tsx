import { styles } from '@/constants/styles';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
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
  const progress = clamp01(ratio);
  const strokeWidth = Math.max(6, Math.round(size * 0.1));
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - progress);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G rotation={-90} originX={cx} originY={cy}>
          <Circle
            cx={cx}
            cy={cy}
            r={r}
            stroke={colorB}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <Circle
            cx={cx}
            cy={cy}
            r={r}
            stroke={colorA}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
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
  // const total = weekly + obligation;
  const ratio = obligation > 0 ? weekly / obligation : 0;

  const owe = obligation - weekly

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
            {/* <ThemedText style={{ marginTop: 6 }}>Weekly: {weekly} min</ThemedText> */}
            <ThemedText>
              Utang: {Math.floor(owe / 60)} jam {owe % 60} menit
            </ThemedText>
          </ThemedView>
        </ThemedView>
      )}
    </ThemedView>
  );
}

export default Pie