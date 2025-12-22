import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  Linking,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  ToastAndroid,
} from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';
import { checkBackgroundTaskStatus, registerBackgroundTask } from '../backgroundTasks';
import { getQuranMinutes, getQuranWeekBreakdown, getTwitterMinutes, openUsageAccessSettings, type QuranWeekBreakdown } from '../usageStats';

export default function HomeScreen() {
  const [twitterMinutes, setTwitterMinutes] = useState<number | null>(null);
  const [quranMinutes, setQuranMinutes] = useState<number | null>(null);
  const [quranWeek, setQuranWeek] = useState<QuranWeekBreakdown | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [backgroundTaskStatus, setBackgroundTaskStatus] = useState<string>('Not registered');

  const loadQuranWeek = async () => {
    setLoadingUsage(true);
    setUsageError(null);
    try {
      const week = await getQuranWeekBreakdown();
      setQuranWeek(week);
    } catch (e: any) {
      console.log('Error when calling getQuranWeekBreakdown:', e);
      setUsageError(e?.message ?? 'Failed to load Quran week breakdown');
      setQuranWeek(null);
    } finally {
      setLoadingUsage(false);
    }
  };

    // Continuously send Quran minutes to API every 2 minutes
  useEffect(() => {
    if (quranMinutes === null) return;

    const sendToApi = () => {
      fetch(`https://home-dashboard-lac.vercel.app/api/quran/${quranMinutes}/210`)
        .then((res) => {
          ToastAndroid.show(`Status: ${res.status}`, ToastAndroid.SHORT);
          return console.log('Ping API status:', res.status)
        })
        .catch((err) => console.log('API error:', err));
    };

    // send immediately on change
    sendToApi();

    const interval = setInterval(sendToApi, 1 * 30 * 1000);

    return () => clearInterval(interval);
  }, [quranMinutes]);


  // Register background task on component mount
  useEffect(() => {
    const setupBackgroundTask = async () => {
      await registerBackgroundTask();
      const status = await checkBackgroundTaskStatus();
      setBackgroundTaskStatus(status.isRegistered ? 'Registered' : 'Not registered');
    };

    setupBackgroundTask();
  }, []);

  // Request notification permission on Android 13+
  useEffect(() => {
    const requestNotifPermission = async () => {
      if (Platform.OS === 'android') {
        const sdk = Number(Platform.Version);
        if (!isNaN(sdk) && sdk >= 33) {
          try {
            await PermissionsAndroid.request('android.permission.POST_NOTIFICATIONS');
          } catch (e) {
            console.log('Notification permission request failed:', e);
          }
        }
      }
    };
    requestNotifPermission();
  }, []);

  const handleLoadUsage = async () => {
    setLoadingUsage(true);
    setUsageError(null);
    try {
      const minutes = await getTwitterMinutes();
      console.log('Chrome minutes from native (POC):', minutes);
      setTwitterMinutes(minutes);
    } catch (e: any) {
      console.log('Error when calling getTwitterMinutes:', e);
      setUsageError(e?.message ?? 'Failed to load usage');
    } finally {
      setLoadingUsage(false);
    }
  };

  const handleLoadQuranUsage = async () => {
    setLoadingUsage(true);
    setUsageError(null);
    try {
      const minutes = await getQuranMinutes();
      console.log('Quran minutes from native:', minutes);
      setQuranMinutes(minutes);
    } catch (e: any) {
      console.log('Error when calling getQuranMinutes:', e);
      setUsageError(e?.message ?? 'Failed to load Quran usage');
    } finally {
      setLoadingUsage(false);
    }
  };

  const handleOpenSettings = () => {
    Linking.openSettings();
  };

  const handleOpenUsageAccessSettings = () => {
    try {
      openUsageAccessSettings();
    } catch (e: any) {
      console.log('Error when opening usage access settings:', e);
      setUsageError(e?.message ?? 'Failed to open usage access settings');
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
          Press{' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12',
            })}
          </ThemedText>{' '}
          to open developer tools.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <Link href="/modal">
          <Link.Trigger>
            <ThemedText type="subtitle">Step 2: Explore</ThemedText>
          </Link.Trigger>
          <Link.Preview />
          <Link.Menu>
            <Link.MenuAction title="Action" icon="cube" onPress={() => alert('Action pressed')} />
            <Link.MenuAction
              title="Share"
              icon="square.and.arrow.up"
              onPress={() => alert('Share pressed')}
            />
            <Link.Menu title="More" icon="ellipsis">
              <Link.MenuAction
                title="Delete"
                icon="trash"
                destructive
                onPress={() => alert('Delete pressed')}
              />
            </Link.Menu>
          </Link.Menu>
        </Link>

        <ThemedText>
          {`Tap the Explore tab to learn more about what's included in this starter app.`}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          {`When you're ready, run `}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Chrome usage POC</ThemedText>
        <ThemedText>
          Press the button below to fetch your Chrome browser usage (last 24h) from the native module.
        </ThemedText>
        <Button title="Load Chrome minutes" onPress={handleLoadUsage} />
        {loadingUsage && <ActivityIndicator style={{ marginTop: 8 }} />}
        {twitterMinutes !== null && !loadingUsage && (
          <ThemedText>
            Chrome usage (last 24h): {twitterMinutes} minutes
          </ThemedText>
        )}
        <Button title="Load Quran minutes" onPress={handleLoadQuranUsage} />
        {quranMinutes !== null && !loadingUsage && (
          <ThemedText>
            Quran usage (last 24h): {quranMinutes} minutes
          </ThemedText>
        )}

        <ThemedView style={styles.weekHeaderRow}>
          <ThemedText type="defaultSemiBold">Quran this week (Mon–Sun)</ThemedText>
          <Pressable onPress={loadQuranWeek} disabled={loadingUsage} style={styles.refreshButton}>
            <ThemedText type="link">{loadingUsage ? 'Loading…' : 'Refresh'}</ThemedText>
          </Pressable>
        </ThemedView>

        {quranWeek && !loadingUsage && (
          <ThemedView style={styles.weekGrid}>
            <ThemedView style={styles.weekRow}>
              <ThemedText style={styles.weekLabel}>Mon</ThemedText>
              <ThemedText style={styles.weekValue}>{quranWeek.monday} min</ThemedText>
            </ThemedView>
            <ThemedView style={styles.weekRow}>
              <ThemedText style={styles.weekLabel}>Tue</ThemedText>
              <ThemedText style={styles.weekValue}>{quranWeek.tuesday} min</ThemedText>
            </ThemedView>
            <ThemedView style={styles.weekRow}>
              <ThemedText style={styles.weekLabel}>Wed</ThemedText>
              <ThemedText style={styles.weekValue}>{quranWeek.wednesday} min</ThemedText>
            </ThemedView>
            <ThemedView style={styles.weekRow}>
              <ThemedText style={styles.weekLabel}>Thu</ThemedText>
              <ThemedText style={styles.weekValue}>{quranWeek.thursday} min</ThemedText>
            </ThemedView>
            <ThemedView style={styles.weekRow}>
              <ThemedText style={styles.weekLabel}>Fri</ThemedText>
              <ThemedText style={styles.weekValue}>{quranWeek.friday} min</ThemedText>
            </ThemedView>
            <ThemedView style={styles.weekRow}>
              <ThemedText style={styles.weekLabel}>Sat</ThemedText>
              <ThemedText style={styles.weekValue}>{quranWeek.saturday} min</ThemedText>
            </ThemedView>
            <ThemedView style={styles.weekRow}>
              <ThemedText style={styles.weekLabel}>Sun</ThemedText>
              <ThemedText style={styles.weekValue}>{quranWeek.sunday} min</ThemedText>
            </ThemedView>

            <ThemedView style={styles.totalRow}>
              <ThemedText type="defaultSemiBold">Total</ThemedText>
              <ThemedText type="defaultSemiBold">{quranWeek.total} min</ThemedText>
            </ThemedView>
          </ThemedView>
        )}

        {usageError && (
          <ThemedText style={{ color: 'red' }}>
            Error: {usageError}
          </ThemedText>
        )}
        <ThemedText>
          Background Task Status: {backgroundTaskStatus}
        </ThemedText>
        <Button title="Open app settings" onPress={handleOpenSettings} />
        <Button title="Grant usage access" onPress={handleOpenUsageAccessSettings} />
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  weekHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  refreshButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  weekGrid: {
    gap: 6,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekLabel: {
    opacity: 0.8,
  },
  weekValue: {
    fontVariant: ['tabular-nums'],
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
