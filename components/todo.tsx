import { styles } from '@/constants/styles';
import { WeekDayKey } from '@/constants/type';
import React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

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


const Todo = ({ todos, setTodos, weekScores, setWeekScores}: { todos: any, setTodos: any, weekScores: any, setWeekScores: any}) => {
  return (
          <ThemedView style={styles.titleContainer}>
            <ThemedView style={styles.todoCard}>
              <ThemedText type="subtitle">Todo</ThemedText>
              <ThemedView style={styles.todoList}>
                {todos.map((t) => (
                  <ThemedView key={t.id} style={styles.todoRow}>
                    <Pressable
                      onPress={() => {
                        const todayKey = getTodayKey();
                        const delta = t.done ? -t.score : t.score;
                        setTodos((prev) => prev.map((p) => (p.id === t.id ? { ...p, done: !p.done } : p)));
                        setWeekScores((prev) => ({
                          ...prev,
                          [todayKey]: (prev[todayKey] ?? 0) + delta,
                        }));
                      }}
                      style={[styles.checkbox, t.done && styles.checkboxChecked]}
                      accessibilityRole="button">
                      <ThemedText style={styles.checkboxText}>{t.done ? '✓' : ''}</ThemedText>
                    </Pressable>
    
                    <ThemedView style={styles.todoTitleWrap}>
                      <ThemedText style={[styles.todoTitle, t.done && styles.todoTitleDone]}>{t.title}</ThemedText>
                    </ThemedView>
    
                    <ThemedView style={styles.scoreWrap}>
                      <ThemedText style={styles.scoreLabel}>score</ThemedText>
                      <TextInput
                        value={String(t.score)}
                        onChangeText={(txt: string) => {
                          const next = Number(String(txt).replace(/[^0-9]/g, ''));
                          const nextScore = Number.isFinite(next) ? next : t.score;
                          const delta = nextScore - t.score;
                          setTodos((prev) => prev.map((p) => (p.id === t.id ? { ...p, score: nextScore } : p)));
    
                          if (t.done && delta !== 0) {
                            const todayKey = getTodayKey();
                            setWeekScores((prev) => ({
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
    
            <ThemedView style={styles.weekCard}>
              <ThemedText type="subtitle">Weekly report</ThemedText>
              <ThemedText style={styles.weekHint}>Auto from completed todo scores</ThemedText>
    
              <ThemedView style={styles.weekBars}>
                {(
                  [
                    ['Mon', 'monday'],
                    ['Tue', 'tuesday'],
                    ['Wed', 'wednesday'],
                    ['Thu', 'thursday'],
                    ['Fri', 'friday'],
                    ['Sat', 'saturday'],
                    ['Sun', 'sunday'],
                  ] as const
                ).map(([label, key]) => {
                  const rawVal = weekScores[key];
                  const val = Math.max(0, Number.isFinite(rawVal) ? rawVal : 0);
                  const barH = 8 + Math.min(72, val * 6);
                  return (
                    <ThemedView key={key} style={styles.barCol}>
                      <View style={[styles.bar, { height: barH }]} />
                      <ThemedText style={styles.barValue}>{val}</ThemedText>
                      <ThemedText style={styles.barLabel}>{label}</ThemedText>
                    </ThemedView>
                  );
                })}
              </ThemedView>
            </ThemedView>
          </ThemedView>
  )
}

export default Todo