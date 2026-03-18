import React from 'react';

import { Animated, Easing, Pressable, View } from 'react-native';

import { SvgXml } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import { DISH_SVGS } from '@/components/learn-tabs/dish-svgs';

export default function LearnTab6() {
  const DISHES = React.useMemo(
    () =>
      DISH_SVGS.map((d) => ({
        ...d,
        xmlTinted: d.xml.replace(/currentColor/g, d.color),
      })),
    [DISH_SVGS],
  );

  const [dishKey, setDishKey] =
    React.useState<(typeof DISHES)[number]['key']>('telor_goreng');
  const selectedDish = React.useMemo(
    () => DISHES.find((d) => d.key === dishKey) ?? DISHES[0],
    [DISHES, dishKey],
  );

  const PRESETS_MIN = React.useMemo(() => [5, 10, 15, 20] as const, []);
  const [durationMin, setDurationMin] =
    React.useState<(typeof PRESETS_MIN)[number]>(10);
  const durationMs = React.useMemo(() => durationMin * 60_000, [durationMin]);

  const [running, setRunning] = React.useState(false);
  const [remainingMs, setRemainingMs] = React.useState(durationMs);
  const [barWidth, setBarWidth] = React.useState(0);

  const startMsRef = React.useRef<number | null>(null);
  const endMsRef = React.useRef<number | null>(null);
  const tickIdRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const cheerSoundsRef = React.useRef<any[]>([]);
  const lastCheerIndexRef = React.useRef<number>(0);

  const progress = React.useRef(new Animated.Value(0)).current;
  const wiggle = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(wiggle, {
          toValue: 1,
          duration: 650,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(wiggle, {
          toValue: 0,
          duration: 650,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [wiggle]);

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const mod: any = await import('expo-av');
        const Audio = mod?.Audio;
        if (!Audio) return;

        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

        const sources = [
          require('../../audio/cheer1.mp3'),
          require('../../audio/cheer2.mp3'),
        ];

        const loadedSounds: any[] = [];
        for (const src of sources) {
          const { sound } = await Audio.Sound.createAsync(src, {
            shouldPlay: false,
          });
          loadedSounds.push(sound);
        }

        if (!mounted) {
          for (const s of loadedSounds) {
            await s.unloadAsync();
          }
          return;
        }

        cheerSoundsRef.current = loadedSounds;
      } catch {
        // ignore
      }
    })();

    return () => {
      mounted = false;
      const sounds = cheerSoundsRef.current;
      cheerSoundsRef.current = [];
      for (const s of sounds) {
        if (s) void s.unloadAsync();
      }
    };
  }, []);

  const playCheer = React.useCallback(async () => {
    const sounds = cheerSoundsRef.current;
    if (!sounds.length) return;
    const s = sounds[Math.floor(Math.random() * sounds.length)];
    if (!s) return;
    try {
      await s.replayAsync();
    } catch {
      // ignore
    }
  }, []);

  const stopTick = React.useCallback(() => {
    if (tickIdRef.current) {
      clearInterval(tickIdRef.current);
      tickIdRef.current = null;
    }
  }, []);

  const reset = React.useCallback(() => {
    stopTick();
    startMsRef.current = null;
    endMsRef.current = null;
    lastCheerIndexRef.current = 0;
    setRunning(false);
    setRemainingMs(durationMs);
    progress.stopAnimation();
    progress.setValue(0);
  }, [durationMs, progress, stopTick]);

  React.useEffect(() => {
    reset();
  }, [durationMs, reset]);

  React.useEffect(() => {
    return () => stopTick();
  }, [stopTick]);

  const formatClock = (ms: number) => {
    const safe = Math.max(0, Number(ms) || 0);
    const totalSec = Math.floor(safe / 1000);
    const mm = Math.floor(totalSec / 60);
    const ss = totalSec % 60;
    return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  };

  const tick = React.useCallback(() => {
    const end = endMsRef.current;
    const start = startMsRef.current;
    if (!end || !start) return;
    const now = Date.now();
    const remain = Math.max(0, end - now);
    setRemainingMs(remain);

    const elapsed = Math.max(0, now - start);
    const cheerEveryMs = 0.1 * 60_000;
    const cheerIndex = Math.floor(elapsed / cheerEveryMs);
    if (cheerIndex > 0 && cheerIndex > lastCheerIndexRef.current) {
      lastCheerIndexRef.current = cheerIndex;
      void playCheer();
    }

    const frac =
      durationMs > 0 ? Math.min(1, Math.max(0, (now - start) / durationMs)) : 1;
    progress.setValue(frac);
    if (remain <= 0) {
      stopTick();
      setRunning(false);
    }
  }, [durationMs, playCheer, progress, stopTick]);

  const start = React.useCallback(() => {
    if (running) return;
    const now = Date.now();
    startMsRef.current = now - (durationMs - remainingMs);
    endMsRef.current = now + remainingMs;
    setRunning(true);

    stopTick();
    tickIdRef.current = setInterval(tick, 200);

    Animated.timing(progress, {
      toValue: 1,
      duration: Math.max(0, remainingMs),
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        stopTick();
        setRunning(false);
        setRemainingMs(0);
      }
    });
  }, [durationMs, remainingMs, running, progress, stopTick, tick]);

  const pause = React.useCallback(() => {
    if (!running) return;
    setRunning(false);
    stopTick();

    progress.stopAnimation((v) => {
      const frac = typeof v === 'number' ? v : 0;
      const nextRemaining = Math.max(0, durationMs - frac * durationMs);
      setRemainingMs(nextRemaining);
    });
  }, [durationMs, progress, running, stopTick]);

  const fillW = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, barWidth],
    extrapolate: 'clamp',
  });

  const mascotStyle = {
    transform: [
      {
        scale: wiggle.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.06],
        }),
      },
    ],
  } as const;

  return (
    <ThemedView style={{ paddingTop: 12, paddingBottom: 16 }}>
      <ThemedView
        style={{
          padding: 14,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: 'rgba(127,127,127,0.18)',
          backgroundColor: 'rgba(127,127,127,0.06)',
        }}
      >
        <ThemedView
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <ThemedView style={{ flex: 1 }}>
            <ThemedText type="subtitle">Eating Time</ThemedText>
            <ThemedText style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>
              Gentle timer for your child
            </ThemedText>
          </ThemedView>

          <Animated.View style={mascotStyle}>
            <ThemedView
              style={{
                width: 46,
                height: 46,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(127,127,127,0.18)',
                backgroundColor: 'rgba(127,127,127,0.08)',
              }}
            >
              <SvgXml xml={selectedDish.xmlTinted} width={34} height={34} />
            </ThemedView>
          </Animated.View>
        </ThemedView>

        <ThemedView style={{ marginTop: 12 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {DISHES.map((d) => {
              const selected = d.key === dishKey;
              return (
                <Pressable
                  key={d.key}
                  onPress={() => setDishKey(d.key)}
                  style={({ pressed }) => ({
                    width: 46,
                    height: 46,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: selected
                      ? 'rgba(236,72,153,0.55)'
                      : 'rgba(127,127,127,0.22)',
                    backgroundColor: pressed
                      ? selected
                        ? 'rgba(236,72,153,0.22)'
                        : 'rgba(127,127,127,0.12)'
                      : selected
                        ? 'rgba(236,72,153,0.12)'
                        : 'rgba(127,127,127,0.06)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  })}
                  accessibilityRole="button"
                >
                  <SvgXml xml={d.xmlTinted} width={28} height={28} />
                </Pressable>
              );
            })}
          </View>
        </ThemedView>

        <ThemedView style={{ marginTop: 14 }}>
          <ThemedView
            onLayout={(e) =>
              setBarWidth(Math.max(0, e.nativeEvent.layout.width))
            }
            style={{
              height: 28,
              borderRadius: 999,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: 'rgba(127,127,127,0.28)',
              backgroundColor: 'rgba(127,127,127,0.08)',
            }}
          >
            <Animated.View
              style={{
                height: '100%',
                width: fillW,
                backgroundColor: running
                  ? 'rgba(34,197,94,0.55)'
                  : 'rgba(59,130,246,0.45)',
              }}
            />
          </ThemedView>
        </ThemedView>

        <ThemedView style={{ marginTop: 6 }}>
          <ThemedText
            style={{
              fontSize: 56,
              lineHeight: 60,
              textAlign: 'center',
              fontVariant: ['tabular-nums'],
            }}
          >
            {formatClock(remainingMs)}
          </ThemedText>
          <ThemedText
            style={{ fontSize: 13, opacity: 0.75, textAlign: 'center' }}
          >
            {durationMin} min
          </ThemedText>
        </ThemedView>

        <ThemedView style={{ marginTop: 14, flexDirection: 'row', gap: 10 }}>
          <Pressable
            onPress={running ? pause : start}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 16,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: running
                ? 'rgba(234,179,8,0.55)'
                : 'rgba(34,197,94,0.55)',
              backgroundColor: pressed
                ? running
                  ? 'rgba(234,179,8,0.22)'
                  : 'rgba(34,197,94,0.22)'
                : running
                  ? 'rgba(234,179,8,0.14)'
                  : 'rgba(34,197,94,0.14)',
              alignItems: 'center',
            })}
            accessibilityRole="button"
          >
            <ThemedText style={{ fontSize: 16 }}>
              {running ? 'Pause' : remainingMs <= 0 ? 'Start Again' : 'Start'}
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={reset}
            style={({ pressed }) => ({
              width: 112,
              paddingVertical: 16,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: 'rgba(127,127,127,0.30)',
              backgroundColor: pressed
                ? 'rgba(127,127,127,0.16)'
                : 'rgba(127,127,127,0.10)',
              alignItems: 'center',
            })}
            accessibilityRole="button"
          >
            <ThemedText style={{ fontSize: 16 }}>Reset</ThemedText>
          </Pressable>
        </ThemedView>

        <ThemedView style={{ marginTop: 14 }}>
          <ThemedText style={{ fontSize: 12, opacity: 0.75, marginBottom: 8 }}>
            Pick a duration
          </ThemedText>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            {PRESETS_MIN.map((m) => {
              const selected = m === durationMin;
              return (
                <Pressable
                  key={m}
                  onPress={() => setDurationMin(m)}
                  style={({ pressed }) => ({
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: selected
                      ? 'rgba(59,130,246,0.55)'
                      : 'rgba(127,127,127,0.28)',
                    backgroundColor: pressed
                      ? selected
                        ? 'rgba(59,130,246,0.22)'
                        : 'rgba(127,127,127,0.14)'
                      : selected
                        ? 'rgba(59,130,246,0.14)'
                        : 'rgba(127,127,127,0.08)',
                  })}
                  accessibilityRole="button"
                >
                  <ThemedText style={{ fontSize: 13 }}>{m} min</ThemedText>
                </Pressable>
              );
            })}
          </View>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}
