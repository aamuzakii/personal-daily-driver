import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { NativeModules } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  registerObligationChecker,
  unregisterObligationChecker,
} from './obligationChecker';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { UsageStats } = NativeModules as any;

  useEffect(() => {
    try {
      UsageStats?.startChromeBlocking?.();
    } catch {}
    // register obligation checker background task
    try {
      registerObligationChecker().catch(() => {});
    } catch {}
    return () => {
      try {
        UsageStats?.stopChromeBlocking?.();
      } catch {}
      try {
        unregisterObligationChecker().catch(() => {});
      } catch {}
    };
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: 'modal', title: 'Modal' }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
