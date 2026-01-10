import { styles } from '@/constants/styles';
import { WeekDayKey } from '@/constants/type';
import { getRandomYoutubeVideoUrlFromChannel } from '@/lib/youtube';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, TextInput } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

type TodoRow = {
  id: string;
  title: string;
  score: number;
  done: boolean;
  link?: string;
};

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


function formatDayLabel(key: WeekDayKey): string {
  return String(key).slice(0, 1).toUpperCase() + String(key).slice(1);
}


const Todo = ({ todos, setTodos, weekScores, setWeekScores, dailyScores, setDailyScores}: { todos: TodoRow[], setTodos: any, weekScores: any, setWeekScores: any, dailyScores: any, setDailyScores: any}) => {
  const todayKey = getTodayKey();
  const router = useRouter();
  const totalCheckedScore = (Array.isArray(todos) ? todos : []).reduce((sum: number, t: TodoRow) => {
    if (!t?.done) return sum;
    const score = Number(t?.score ?? 0);
    return sum + (Number.isFinite(score) ? score : 0);
  }, 0);

  return (
          <ThemedView style={styles.titleContainer}>
            <ThemedView style={styles.todoCard}>
              <ThemedText type="subtitle">Todo</ThemedText>
              <ThemedText>{formatDayLabel(todayKey)}</ThemedText>
              <ThemedText>Total: {totalCheckedScore}</ThemedText>
              <ThemedView style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
                <Pressable
                  onPress={() => {
                    const todayKey = getTodayKey();
                    setTodos((prev: TodoRow[]) => prev.map((p: TodoRow) => ({ ...p, done: false })));
                    setWeekScores((prev: any) => ({
                      ...prev,
                      [todayKey]: 0,
                    }));
                  }}
                  style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(127,127,127,0.25)' }}
                  accessibilityRole="button"
                >
                  <ThemedText>Clear All</ThemedText>
                </Pressable>
              </ThemedView>
              <ThemedView style={styles.todoList}>
                {todos.map((t: TodoRow) => (
                  <ThemedView key={t.id} style={styles.todoRow}>
                    <Pressable
                      onPress={() => {
                        const todayKey = getTodayKey();
                        const delta = t.done ? -t.score : t.score;
                        setTodos((prev: TodoRow[]) => prev.map((p: TodoRow) => (p.id === t.id ? { ...p, done: !p.done } : p)));
                        setWeekScores((prev: any) => ({
                          ...prev,
                          [todayKey]: (prev[todayKey] ?? 0) + delta,
                        }));
                      }}
                      style={[styles.checkbox, t.done && styles.checkboxChecked]}
                      accessibilityRole="button">
                      <ThemedText style={styles.checkboxText}>{t.done ? '✓' : ''}</ThemedText>
                    </Pressable>
    
                    <Pressable
                      onPress={() => {
                        const go = async () => {
                          if (!t?.link) return;
                          try {
                            let url = String(t.link);
                            if (url === 'yt_random') {
                              url = await getRandomYoutubeVideoUrlFromChannel();
                            }
                            if (!url || !(url.startsWith('http://') || url.startsWith('https://'))) return;
                            router.push({ pathname: '/webview', params: { url, title: String(t.title ?? 'Web') } });
                          } catch {}
                        };
                        go();
                      }}
                      style={styles.todoTitleWrap}
                      accessibilityRole="link"
                    >
                      <ThemedText style={[styles.todoTitle, t.done && styles.todoTitleDone]}>{t.title}</ThemedText>
                    </Pressable>
    
                    <ThemedView style={styles.scoreWrap}>
                      <ThemedText style={styles.scoreLabel}>score</ThemedText>
                      <TextInput
                        value={String(t.score)}
                        onChangeText={(txt: string) => {
                          const next = Number(String(txt).replace(/[^0-9]/g, ''));
                          const nextScore = Number.isFinite(next) ? next : t.score;
                          const delta = nextScore - t.score;
                          setTodos((prev: TodoRow[]) => prev.map((p: TodoRow) => (p.id === t.id ? { ...p, score: nextScore } : p)));
    
                          if (t.done && delta !== 0) {
                            const todayKey = getTodayKey();
                            setWeekScores((prev: any) => ({
                              ...prev,
                              [todayKey]: (prev[todayKey] ?? 0) + delta,
                            }));
                          }
                        }}
                        keyboardType="number-pad"
                        style={styles.scoreInput}
                      />
                    </ThemedView>
                  </ThemedView>
                ))}
              </ThemedView>
            </ThemedView>
    

    {/* i just  */}

          </ThemedView>
  )
}

export default Todo