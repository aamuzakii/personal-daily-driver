import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  Button,
  Image,
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
import { fetchChannelVideoUrls } from '@/lib/youtubeApi';
import { checkBackgroundTaskStatus, registerBackgroundTask } from '../backgroundTasks';
import { getQuranMinutes, getQuranWeekBreakdown, getTwitterMinutes, openUsageAccessSettings, type QuranWeekBreakdown } from '../usageStats';

type TodoItem = {
  id: string;
  title: string;
  link: string;
  score: number;
  done: boolean;
};

type DailyScores = Record<string, number>;


export default function HomeScreen() {
  const [twitterMinutes, setTwitterMinutes] = useState<number | null>(null);
  const [quranMinutes, setQuranMinutes] = useState<number | null>(null);
  const [quranWeek, setQuranWeek] = useState<QuranWeekBreakdown | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [backgroundTaskStatus, setBackgroundTaskStatus] = useState<string>('Not registered');

  const DEFAULT_TODOS: TodoItem[] = [
    { id: 'zikir-pagi', title: 'Zikir Pagi', link: 'https://www.instagram.com/boris.tan/', score: 10, done: false },
    { id: 'zikir-petang', title: 'Zikir Petang', link: 'yt_random', score: 10, done: false },
    { id: 'duha', title: 'Shalat Dhuha', link: 'https://www.youtube.com/watch?v=YDvsBbKfLPA', score: 10, done: false },
    { id: 'witir', title: 'Shalat Witir', link: 'https://example.com/d', score: 10, done: false },
    { id: 'mutun', title: 'Familiar Mutun + Riyadhushhalihin: 10 menit sehari', link: 'https://example.com/e', score: 10, done: false },
    { id: 'recite', title: 'Baca Quran 1 Juz / 30 menit', link: 'https://example.com/f', score: 10, done: false },
    { id: 'hsk', title: 'HSK 5', link: 'https://www.youtube.com/watch?v=vTVuuJ5xBco', score: 3, done: false },
    { id: 'speaking-english', title: 'Speaking Elsa 10 menit', link: 'https://www.youtube.com/watch?v=vOTiJkg1voo', score: 3, done: false },
    { id: 'arab-vocab', title: '5 Arabic Vocab Amiyah', link: 'https://example.com/i', score: 4, done: false },
  ];

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

  const [dailyScores, setDailyScores] = useState<DailyScores>({});

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
        const [savedTodos, savedWeek, savedDaily] = await Promise.all([
          AsyncStorage.getItem('home.todos.v4'),
          AsyncStorage.getItem('home.weekScores.v3'),
          AsyncStorage.getItem('home.dailyScores.v3'),
        ]);

        if (savedTodos) {
          const parsed = JSON.parse(savedTodos);
          const savedList: TodoItem[] = Array.isArray(parsed) ? parsed : [];

          const defaultsById = new Map(DEFAULT_TODOS.map((t) => [t.id, t] as const));
          const merged = savedList.map((t) => {
            const d = defaultsById.get(t.id);
            if (!d) return t;
            return {
              ...t,
              title: d.title,
              link: d.link,
              score: d.score,
            };
          });

          setTodos(merged);
        } else {
          setTodos(DEFAULT_TODOS);
        }

        if (savedWeek) {
          setWeekScores(JSON.parse(savedWeek));
        }

        if (savedDaily) {
          setDailyScores(JSON.parse(savedDaily));
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
        await AsyncStorage.setItem('home.todos.v4', JSON.stringify(todos));
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
        await AsyncStorage.setItem('home.weekScores.v3', JSON.stringify(weekScores));
      } catch (e) {
        console.log('Failed to save week scores:', e);
      }
    };
    saveLocalWeek();
  }, [weekScores]);

  useEffect(() => {
    const saveLocalDaily = async () => {
      try {
        await AsyncStorage.setItem('home.dailyScores.v3', JSON.stringify(dailyScores));
      } catch (e) {
        console.log('Failed to save daily scores:', e);
      }
    };
    saveLocalDaily();
  }, [dailyScores]);

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

  useEffect(() => {
    const run = async () => {
      await handleLoadQuranUsage();
    };
    run();
  }, []);

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

  const handleResetLocal = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem('home.todos.v3'),
        AsyncStorage.removeItem('home.weekScores.v3'),
        AsyncStorage.removeItem('home.dailyScores.v3'),
      ]);
    } catch (e) {
      console.log('Failed to clear local data:', e);
    }

    setTodos(DEFAULT_TODOS);
    setWeekScores({
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0,
    });
    setDailyScores({});
  };

  const handleFetchChannelVideos = async () => {
    try {
      const urls = await fetchChannelVideoUrls({
        channelId: 'UClCl3I9DfH4HUty22wPF9eg',
        maxPages: 1,
        pageSize: 50,
      });
      console.log('Total videos:', urls);
    } catch (e) {
      console.log('Failed to fetch YouTube channel video URLs:', e);
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
      <Button title="Reset local todo" onPress={handleResetLocal} />
      {/* <Button title="Fetch YT channel videos Log" onPress={handleFetchChannelVideos} /> */}
      <Todo  todos={todos} setTodos={setTodos} weekScores={weekScores} setWeekScores={setWeekScores} dailyScores={dailyScores} setDailyScores={setDailyScores} />
      <Wellbeing handleLoadQuranUsage={handleLoadQuranUsage} quranMinutes={quranMinutes} loadingUsage={loadingUsage} quranWeek={quranWeek} loadQuranWeek={loadQuranWeek} handleLoadUsage={handleLoadUsage} twitterMinutes={twitterMinutes} usageError={usageError} backgroundTaskStatus={backgroundTaskStatus} handleOpenSettings={handleOpenSettings} handleOpenUsageAccessSettings={handleOpenUsageAccessSettings}></Wellbeing>
    </ParallaxScrollView>
  );
}


