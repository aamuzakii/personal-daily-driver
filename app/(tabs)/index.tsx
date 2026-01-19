import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  AppState,
  Image,
  Linking,
  Modal,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import Pie from '@/components/pie';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import Todo from '@/components/todo';
import Wellbeing from '@/components/wellbeing';
import { HEADER_IMAGES, HEADER_QUOTES } from '@/constants/headerItems';
import { styles } from '@/constants/styles';
import { WeekDayKey } from '@/constants/type';
import { getHeaderSelection } from '@/lib/headerRotation';
import {
  ensureGeneralTodoTable,
  ensureResetMarkTable,
  getSqliteDbDump,
  hasResetMark,
  loadGeneralTodos,
  markReset,
  openAppDb,
  toYmd,
  upsertGeneralTodos,
} from '@/lib/resetMark';
import { fetchChannelVideoUrls } from '@/lib/youtubeApi';
import {
  checkBackgroundTaskStatus,
  registerBackgroundTask,
} from '../backgroundTasks';
import {
  getQuranMinutes,
  getQuranWeekBreakdown,
  getTwitterMinutes,
  openUsageAccessSettings,
  type QuranWeekBreakdown,
} from '../usageStats';

type TodoItem = {
  id: string;
  title: string;
  link: string;
  score: number;
  done: boolean;
};

type DailyScores = Record<string, number>;

function getTodayKey(d = new Date()): WeekDayKey {
  const js = d.getDay();
  if (js === 0) return 'sunday';
  if (js === 1) return 'monday';
  if (js === 2) return 'tuesday';
  if (js === 3) return 'wednesday';
  if (js === 4) return 'thursday';
  if (js === 5) return 'friday';
  return 'saturday';
}

export default function HomeScreen() {
  const db = openAppDb();

  const [dbDump, setDbDump] = useState<string>('');
  const [dumpingDb, setDumpingDb] = useState(false);
  const [dbDumpVisible, setDbDumpVisible] = useState(false);

  const [headerSel, setHeaderSel] = useState<{
    type: 'image' | 'quote';
    index: number;
  }>({ type: 'image', index: 0 });

  const [twitterMinutes, setTwitterMinutes] = useState<number | null>(null);
  const [quranMinutes, setQuranMinutes] = useState<number | null>(null);
  const [quranWeek, setQuranWeek] = useState<QuranWeekBreakdown | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [backgroundTaskStatus, setBackgroundTaskStatus] =
    useState<string>('Not registered');

  const DEFAULT_TODOS: TodoItem[] = [
    {
      id: 'zikir-pagi',
      title: 'Zikir Pagi',
      link: 'https://www.instagram.com/boris.tan/',
      score: 10,
      done: false,
    },
    {
      id: 'zikir-petang',
      title: 'Zikir Petang',
      link: 'fiqih_yt_random',
      score: 10,
      done: false,
    },
    { id: 'duha', title: 'Shalat Dhuha', link: '', score: 10, done: false },
    {
      id: 'witir',
      title: 'Shalat Witir',
      link: 'https://play.google.com/store/apps/details?id=com.ichi2.anki&hl=en',
      score: 10,
      done: false,
    },
    {
      id: 'mutun',
      title: 'Familiar Mutun + Riyadhushhalihin: 10 menit sehari',
      link: 'https://www.youtube.com/watch?v=jyeikSj0Qt4&list=PLR-wSuUv3U1z1If_ANqpdtcjyV70wmqVK&index=55',
      score: 10,
      done: false,
    },
    {
      id: 'recite',
      title: 'Baca Quran 1 Juz / 30 menit',
      link: 'https://play.google.com/store/apps/details?id=com.quran.labs.androidquran&hl=en',
      score: 10,
      done: false,
    },
    { id: 'hsk', title: 'HSK 5', link: '', score: 3, done: false },
    {
      id: 'speaking-english',
      title: 'Speaking Elsa 10 menit',
      link: '',
      score: 3,
      done: false,
    },
    {
      id: 'arab-vocab',
      title: '5 Arabic Vocab Amiyah',
      link: '',
      score: 4,
      done: false,
    },
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

  const maybeResetHomeTodoForToday = async () => {
    try {
      await ensureResetMarkTable(db);
      const resetKey = `${toYmd(new Date())}|home_todo`;
      const already = await hasResetMark(db, resetKey);
      if (already) return false;

      const todayKey = getTodayKey();
      setTodos((prev) =>
        Array.isArray(prev) ? prev.map((t) => ({ ...t, done: false })) : prev,
      );
      setWeekScores((prev) => ({
        ...prev,
        [todayKey]: 0,
      }));
      await markReset(db, resetKey);
      return true;
    } catch (e) {
      console.log('Failed to run home todo daily reset check:', e);
      return false;
    }
  };

  const handleShowDbDump = async () => {
    if (dumpingDb) return;
    setDumpingDb(true);
    try {
      const dump = await getSqliteDbDump(db, 200);
      setDbDump(dump);
      setDbDumpVisible(true);
    } catch (e) {
      setDbDump(String(e));
      setDbDumpVisible(true);
    } finally {
      setDumpingDb(false);
    }
  };

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
        try {
          const sel = await getHeaderSelection();
          setHeaderSel(sel);
        } catch {}

        const [savedWeek, savedDaily] = await Promise.all([
          AsyncStorage.getItem('home.weekScores.v3'),
          AsyncStorage.getItem('home.dailyScores.v3'),
        ]);

        await ensureGeneralTodoTable(db);
        const loaded = await loadGeneralTodos(db);
        if (Array.isArray(loaded) && loaded.length > 0) {
          const defaultsById = new Map(
            DEFAULT_TODOS.map((t) => [t.id, t] as const),
          );
          const merged = loaded.map((t) => {
            const d = defaultsById.get(t.id);
            if (!d) return t;
            return {
              ...t,
              title: d.title,
              link: d.link,
              score: d.score,
            };
          });
          setTodos(merged as any);
        } else {
          setTodos(DEFAULT_TODOS);
          await upsertGeneralTodos(db, DEFAULT_TODOS);
        }

        if (savedWeek) {
          setWeekScores(JSON.parse(savedWeek));
        }

        if (savedDaily) {
          setDailyScores(JSON.parse(savedDaily));
        }

        await maybeResetHomeTodoForToday();
      } catch (e) {
        console.log('Failed to load local todo/week data:', e);
      }
    };
    loadLocal();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      getHeaderSelection()
        .then(setHeaderSel)
        .catch(() => {});
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      maybeResetHomeTodoForToday();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const saveSqliteTodos = async () => {
      try {
        await ensureGeneralTodoTable(db);
        await upsertGeneralTodos(
          db,
          Array.isArray(todos) ? (todos as any) : [],
        );
      } catch (e) {
        console.log('Failed to save todos (sqlite):', e);
      }
    };
    if (todos.length === 0) return;
    saveSqliteTodos();
  }, [todos]);

  useEffect(() => {
    const saveLocalWeek = async () => {
      try {
        await AsyncStorage.setItem(
          'home.weekScores.v3',
          JSON.stringify(weekScores),
        );
      } catch (e) {
        console.log('Failed to save week scores:', e);
      }
    };
    saveLocalWeek();
  }, [weekScores]);

  useEffect(() => {
    const saveLocalDaily = async () => {
      try {
        await AsyncStorage.setItem(
          'home.dailyScores.v3',
          JSON.stringify(dailyScores),
        );
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
      fetch(
        `https://home-dashboard-lac.vercel.app/api/quran/${quranMinutes}/210`,
      )
        .then((res) => {
          // ToastAndroid.show(`Status: ${res.status}`, ToastAndroid.SHORT);
          // return console.log('Ping API status:', res.status)
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
      setBackgroundTaskStatus(
        status.isRegistered ? 'Registered' : 'Not registered',
      );
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
            await PermissionsAndroid.request(
              'android.permission.POST_NOTIFICATIONS',
            );
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

  const headerSlide =
    headerSel.type === 'image' ? (
      <Image
        source={HEADER_IMAGES[headerSel.index] ?? HEADER_IMAGES[0]}
        style={styles.reactLogo}
        resizeMode="cover"
      />
    ) : (
      <ThemedView
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 18,
        }}
      >
        <View style={{ maxWidth: 520 }}>
          <ThemedText type="title" style={{ textAlign: 'center' }}>
            {HEADER_QUOTES[headerSel.index] ?? HEADER_QUOTES[0]}
          </ThemedText>
        </View>
      </ThemedView>
    );

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={headerSlide}
    >
      {/* <Button title="Reset local todo" onPress={handleResetLocal} /> */}
      {__DEV__ ? (
        <ThemedView
          style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}
        >
          <Modal
            visible={dbDumpVisible}
            animationType="slide"
            onRequestClose={() => setDbDumpVisible(false)}
          >
            <ThemedView
              style={{
                flex: 1,
                paddingTop: 18,
                paddingHorizontal: 16,
                paddingBottom: 16,
              }}
            >
              <ThemedView
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <ThemedText type="subtitle">SQLite Dump</ThemedText>
                <Pressable
                  onPress={() => setDbDumpVisible(false)}
                  style={{ paddingHorizontal: 10, paddingVertical: 6 }}
                >
                  <ThemedText>Close</ThemedText>
                </Pressable>
              </ThemedView>
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 24 }}
              >
                <ThemedText style={{ fontSize: 12, lineHeight: 16 }} selectable>
                  {dbDump || '(empty)'}
                </ThemedText>
              </ScrollView>
            </ThemedView>
          </Modal>

          <ThemedView
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              gap: 10,
            }}
          >
            <ThemedText onPress={handleShowDbDump}>
              {dumpingDb ? 'Loading DB…' : 'Show DB'}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      ) : null}
      <Pie />
      <ThemedText
        onPress={() =>
          Linking.openURL('https://www.youtube.com/watch?v=bNyUyrR0PHo')
        }
        style={{
          color: '#007AFF',
          textDecorationLine: 'underline',
          textAlign: 'center',
          marginVertical: 10,
        }}
      >
        AR
      </ThemedText>
      <ThemedText
        onPress={() =>
          Linking.openURL('https://www.youtube.com/watch?v=YDvsBbKfLPA')
        }
        style={{
          color: '#007AFF',
          textDecorationLine: 'underline',
          textAlign: 'center',
          marginVertical: 10,
        }}
      >
        UK
      </ThemedText>
      <ThemedText
        onPress={() =>
          Linking.openURL('https://www.youtube.com/watch?v=vOTiJkg1voo')
        }
        style={{
          color: '#007AFF',
          textDecorationLine: 'underline',
          textAlign: 'center',
          marginVertical: 10,
        }}
      >
        AU
      </ThemedText>
      <ThemedText
        onPress={() =>
          Linking.openURL('https://www.youtube.com/watch?v=vTVuuJ5xBco')
        }
        style={{
          color: '#007AFF',
          textDecorationLine: 'underline',
          textAlign: 'center',
          marginVertical: 10,
        }}
      >
        CN
      </ThemedText>
      {/* <Button title="Fetch YT channel videos Log" onPress={handleFetchChannelVideos} /> */}
      <Todo
        todos={todos}
        setTodos={setTodos}
        weekScores={weekScores}
        setWeekScores={setWeekScores}
        dailyScores={dailyScores}
        setDailyScores={setDailyScores}
      />
      <Wellbeing
        handleLoadQuranUsage={handleLoadQuranUsage}
        quranMinutes={quranMinutes}
        loadingUsage={loadingUsage}
        quranWeek={quranWeek}
        loadQuranWeek={loadQuranWeek}
        handleLoadUsage={handleLoadUsage}
        twitterMinutes={twitterMinutes}
        usageError={usageError}
        backgroundTaskStatus={backgroundTaskStatus}
        handleOpenSettings={handleOpenSettings}
        handleOpenUsageAccessSettings={handleOpenUsageAccessSettings}
      ></Wellbeing>
    </ParallaxScrollView>
  );
}
