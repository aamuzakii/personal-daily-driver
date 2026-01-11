import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { startChromeBlocking, stopChromeBlocking } from '@/app/usageStats';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getRelaxState, tickRelax } from '@/lib/relaxMode';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const relaxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncBlockingWithRelax = async () => {
    try {
      await tickRelax();
      const state = await getRelaxState();

      if (relaxTimerRef.current) {
        clearTimeout(relaxTimerRef.current);
        relaxTimerRef.current = null;
      }

      if (state.isRelaxing && state.chunkRemainingMs > 0) {
        relaxTimerRef.current = setTimeout(() => {
          syncBlockingWithRelax();
        }, Math.max(250, state.chunkRemainingMs + 250));
      }

      if (state.isRelaxing && state.remainingMs > 0) {
        try {
          stopChromeBlocking();
        } catch {}
        return;
      }
      try {
        startChromeBlocking();
      } catch {}
    } catch {}
  };

  useEffect(() => {
    syncBlockingWithRelax();
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      syncBlockingWithRelax();
    });
    return () => {
      sub.remove();
      if (relaxTimerRef.current) {
        clearTimeout(relaxTimerRef.current);
        relaxTimerRef.current = null;
      }
      try {
        stopChromeBlocking();
      } catch {}
    };
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
