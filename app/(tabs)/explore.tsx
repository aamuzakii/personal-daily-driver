import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { styles } from '@/constants/styles';

const ITEMS = [
  'Al Ikhlas',
  'Al Ikhlas',
  'Al Ikhlas',
  'Al Falaq',
  'Al Falaq',
  'Al Falaq',
  'An Naas',
  'An Naas',
  'An Naas',
  'أصبحنا وأصبح الملك لله والحمد لله لا إله إلا الله وحده لا شريك له له الملك وله الحمد وهو على كل شيء قدير',
  'ربِ اسألك خير ما في هذا اليوم وخير ما بعده واعوذ بك من شر ما في هذا اليوم وشر ما بعده',
  'ربِّ اعوذ بك من الكسل وسوء الكبر ربِّ اعوذ بك من عذاب في النار وعذاب في القبر',
  'اللهم بك اصبحنا',
  'Sayyidul Istighfar',
  'اللهم عافني في بدني. اللَّهمَّ إنِّي أعوذُ بِكَ منَ الكُفْرِ والفقرِ اللَّهمَّ إنِّي أعوذُ بكَ من عذابِ القبرِ',
  'اللهم عافني في بدني. اللَّهمَّ إنِّي أعوذُ بِكَ منَ الكُفْرِ والفقرِ اللَّهمَّ إنِّي أعوذُ بكَ من عذابِ القبرِ',
  'اللهم عافني في بدني. اللَّهمَّ إنِّي أعوذُ بِكَ منَ الكُفْرِ والفقرِ اللَّهمَّ إنِّي أعوذُ بكَ من عذابِ القبرِ',
  'اني أسألك العفو والعافية',
  'اللهم عالم الغيب',
  'رضيت',
  'رضيت',
  'رضيت',
  'بسم الله الذي لا يضر مع اسمه',
  'بسم الله الذي لا يضر مع اسمه',
  'بسم الله الذي لا يضر مع اسمه',
  'اعوذ بكلمات الله',
  'اعوذ بكلمات الله',
  'اعوذ بكلمات الله',
  'يا حي يا قيوم',
  'اصبحنا على فطرة الاسلام',
  'لا اله الا الله واحده لا شريك له',
  'ilmu, rizki, amal',
  'subhanallah wa bihamdih 100',
  'istigfar 100',
  '2 ayat terakhir Al Baqarah',
  '⚖️',
];

export default function TabTwoScreen() {
  const [checked, setChecked] = useState<boolean[]>(() => ITEMS.map(() => false));
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const scheduleNextReset = () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);

      const now = new Date();
      const candidates = [11, 23].map((hour) => {
        const d = new Date(now);
        d.setHours(hour, 0, 0, 0);
        if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
        return d;
      });

      const next = candidates.sort((a, b) => a.getTime() - b.getTime())[0];
      const ms = Math.max(0, next.getTime() - now.getTime());

      resetTimeoutRef.current = setTimeout(() => {
        setChecked(ITEMS.map(() => false));
        scheduleNextReset();
      }, ms);
    };

    scheduleNextReset();
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 24 }}
    >
      <View style={{ height: 24 }} />
      <ThemedView style={{ padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(127,127,127,0.25)' }}>
        <ThemedView style={styles.titleContainer}>
          <ThemedView style={styles.todoCard}>
            <ThemedText type="subtitle">Todo</ThemedText>
            <ThemedView style={styles.todoList}>
              {ITEMS.map((title, idx) => {
                const isChecked = !!checked[idx];
                return (
                  <ThemedView key={`${idx}-${title}`} style={styles.todoRow}>
                    <Pressable
                      onPress={() => {
                        setChecked((prev) => prev.map((v, i) => (i === idx ? !v : v)));
                      }}
                      style={[styles.checkbox, isChecked && styles.checkboxChecked]}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isChecked }}
                    >
                      <ThemedText style={styles.checkboxText}>{isChecked ? '✓' : ''}</ThemedText>
                    </Pressable>
                    <ThemedView style={styles.todoTitleWrap}>
                      <ThemedText style={[styles.todoTitle, isChecked && styles.todoTitleDone]}>{title}</ThemedText>
                    </ThemedView>
                  </ThemedView>
                );
              })}
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}
