import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import {
  Linking,
  PermissionsAndroid,
  Platform,
  ToastAndroid
} from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import Todo from '@/components/todo';
import Wellbeing from '@/components/wellbeing';
import { styles } from '@/constants/styles';
import { WeekDayKey } from '@/constants/type';
import { checkBackgroundTaskStatus, registerBackgroundTask } from '../backgroundTasks';
import { getQuranMinutes, getQuranWeekBreakdown, getTwitterMinutes, openUsageAccessSettings, type QuranWeekBreakdown } from '../usageStats';

type TodoItem = {
  id: string;
  title: string;
  score: number;
  done: boolean;
};


export default function HomeScreen() {
  const [twitterMinutes, setTwitterMinutes] = useState<number | null>(null);
  const [quranMinutes, setQuranMinutes] = useState<number | null>(null);
  const [quranWeek, setQuranWeek] = useState<QuranWeekBreakdown | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [backgroundTaskStatus, setBackgroundTaskStatus] = useState<string>('Not registered');

  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [weekScores, setWeekScores] = useState<Record<WeekDayKey, number>>({
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
    saturday: 0,
    sunday: 0,
  });

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

  useEffect(() => {
    const loadLocal = async () => {
      try {
        const [savedTodos, savedWeek] = await Promise.all([
          AsyncStorage.getItem('home.todos.v1'),
          AsyncStorage.getItem('home.weekScores.v1'),
        ]);

        if (savedTodos) {
          setTodos(JSON.parse(savedTodos));
        } else {
          setTodos([
            { id: 'recite', title: 'recite', score: 10, done: false },
            { id: 'hsk', title: 'HSK', score: 3, done: false },
            { id: 'arab', title: 'learn arab', score: 4, done: false },
          ]);
        }

        if (savedWeek) {
          setWeekScores(JSON.parse(savedWeek));
        }
      } catch (e) {
        console.log('Failed to load local todo/week data:', e);
      }
    };
    loadLocal();
  }, []);

  useEffect(() => {
    const saveLocalTodos = async () => {
      try {
        await AsyncStorage.setItem('home.todos.v1', JSON.stringify(todos));
      } catch (e) {
        console.log('Failed to save todos:', e);
      }
    };
    if (todos.length === 0) return;
    saveLocalTodos();
  }, [todos]);

  useEffect(() => {
    const saveLocalWeek = async () => {
      try {
        await AsyncStorage.setItem('home.weekScores.v1', JSON.stringify(weekScores));
      } catch (e) {
        console.log('Failed to save week scores:', e);
      }
    };
    saveLocalWeek();
  }, [weekScores]);

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
      <Todo  todos={todos} setTodos={setTodos} weekScores={weekScores} setWeekScores={setWeekScores} />
      <Wellbeing handleLoadQuranUsage={handleLoadQuranUsage} quranMinutes={quranMinutes} loadingUsage={loadingUsage} quranWeek={quranWeek} loadQuranWeek={loadQuranWeek} handleLoadUsage={handleLoadUsage} twitterMinutes={twitterMinutes} usageError={usageError} backgroundTaskStatus={backgroundTaskStatus} handleOpenSettings={handleOpenSettings} handleOpenUsageAccessSettings={handleOpenUsageAccessSettings}></Wellbeing>
    </ParallaxScrollView>
  );
}


