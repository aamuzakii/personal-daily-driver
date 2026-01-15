import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import {
  clearZikrChecked,
  ensureResetMarkTable,
  ensureZikrTable,
  execSql,
  getSqliteDbDump,
  hasResetMark,
  loadZikrChecked,
  markReset,
  openAppDb,
  setZikrCheckedAt,
  toYmd,
} from '@/lib/resetMark';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { useEffect, useState } from 'react';
import { AppState, Modal, Platform, Pressable, ScrollView, View } from 'react-native';

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

const CHECKED_STORAGE_KEY = 'explore.checked.v1';

export default function TabTwoScreen() {
  const [checked, setChecked] = useState<boolean[]>(() => ITEMS.map(() => false));
  const [exporting, setExporting] = useState(false);
  const [dbDump, setDbDump] = useState<string>('');
  const [dumpingDb, setDumpingDb] = useState(false);
  const [dbDumpVisible, setDbDumpVisible] = useState(false);

  const db = openAppDb();

  const getCurrentResetKey = () => {
    const now = new Date();
    const today11 = new Date(now);
    today11.setHours(11, 0, 0, 0);

    const today23 = new Date(now);
    today23.setHours(23, 0, 0, 0);

    if (now.getTime() >= today23.getTime()) return `${toYmd(now)}|evening`;
    if (now.getTime() >= today11.getTime()) return `${toYmd(now)}|morning`;

    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    return `${toYmd(y)}|evening`;
  };

  const resetChecked = async () => {
    setChecked(ITEMS.map(() => false));
    try {
      await ensureZikrTable(db);
      await clearZikrChecked(db);
    } catch (e) {
      console.log('Failed to clear zikr checked state (sqlite):', e);
    }
    await AsyncStorage.removeItem(CHECKED_STORAGE_KEY).catch((e) => {
      console.log('Failed to clear explore checked state:', e);
    });
  };

  const maybeResetForCurrentPeriod = async () => {
    try {
      await ensureResetMarkTable(db);
      const resetKey = getCurrentResetKey();
      const already = await hasResetMark(db, resetKey);
      if (already) return false;

      await resetChecked();
      await markReset(db, resetKey);
      return true;
    } catch (e) {
      console.log('Failed to run explore reset check:', e);
      return false;
    }
  };

  const handleShowDbDump = async () => {
    if (dumpingDb) return;
    setDumpingDb(true);
    try {
      const dump = await getSqliteDbDump(db, 2000);
      setDbDump(dump);
      setDbDumpVisible(true);
    } catch (e) {
      setDbDump(String(e));
      setDbDumpVisible(true);
    } finally {
      setDumpingDb(false);
    }
  };

  const sqlEscape = (v: any) => {
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL';
    if (typeof v === 'boolean') return v ? '1' : '0';
    const s = String(v);
    return `'${s.replace(/'/g, "''")}'`;
  };

  const exportSqlDump = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const tblRes = await execSql(
        db,
        `SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
      );
      const tables: { name: string; sql: string }[] = [];

      for (let i = 0; i < (tblRes?.rows?.length ?? 0); i++) {
        const row = tblRes.rows.item(i);
        if (!row?.name || !row?.sql) continue;
        tables.push({ name: row.name, sql: row.sql });
      }

      let dump = '';
      dump += 'PRAGMA foreign_keys=OFF;\n';
      dump += 'BEGIN TRANSACTION;\n';

      for (const t of tables) {
        dump += `DROP TABLE IF EXISTS ${t.name};\n`;
        dump += `${t.sql};\n`;
      }

      for (const t of tables) {
        const infoRes = await execSql(db, `PRAGMA table_info(${t.name})`);
        const cols: string[] = [];
        for (let i = 0; i < (infoRes?.rows?.length ?? 0); i++) {
          const r = infoRes.rows.item(i);
          if (r?.name) cols.push(r.name);
        }

        if (cols.length === 0) continue;

        const dataRes = await execSql(db, `SELECT * FROM ${t.name}`);
        for (let i = 0; i < (dataRes?.rows?.length ?? 0); i++) {
          const row = dataRes.rows.item(i);
          const values = cols.map((c) => sqlEscape(row?.[c]));
          dump += `INSERT INTO ${t.name} (${cols.join(', ')}) VALUES (${values.join(', ')});\n`;
        }
      }

      dump += 'COMMIT;\n';

      const ts = new Date();
      const stamp = `${ts.getFullYear()}${String(ts.getMonth() + 1).padStart(2, '0')}${String(ts.getDate()).padStart(2, '0')}_${String(
        ts.getHours()
      ).padStart(2, '0')}${String(ts.getMinutes()).padStart(2, '0')}${String(ts.getSeconds()).padStart(2, '0')}`;

      if (Platform.OS === 'android' && (FileSystem as any).StorageAccessFramework) {
        const SAF = (FileSystem as any).StorageAccessFramework;
        const downloadsTreeUri = 'content://com.android.externalstorage.documents/tree/primary%3ADownload';
        const perm = await SAF.requestDirectoryPermissionsAsync(downloadsTreeUri);
        if (!perm.granted) {
          console.log('SQL dump export cancelled: no directory permission');
          return;
        }

        const fileName = `app_dump_${stamp}.sql`;
        const targetUri = await SAF.createFileAsync(perm.directoryUri, fileName, 'application/sql');
        await FileSystem.writeAsStringAsync(targetUri, dump, { encoding: 'utf8' as any });
        console.log('SQL dump exported to Downloads:', targetUri);
      } else {
        const dir = (FileSystem as any).documentDirectory ?? (FileSystem as any).cacheDirectory ?? '';
        const fileUri = `${dir}app_dump_${stamp}.sql`;
        await FileSystem.writeAsStringAsync(fileUri, dump, { encoding: 'utf8' as any });
        console.log('SQL dump exported to:', fileUri);
      }
    } catch (e) {
      console.log('Failed to export SQL dump:', e);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    const loadLocal = async () => {
      try {
        const didReset = await maybeResetForCurrentPeriod();
        if (didReset) return;

        await ensureZikrTable(db);
        const map = await loadZikrChecked(db);
        const normalized = ITEMS.map((_, idx) => map.get(idx) ?? false);
        setChecked(normalized);
      } catch (e) {
        console.log('Failed to load explore checked state:', e);
      }
    };

    loadLocal();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      maybeResetForCurrentPeriod();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    // no-op: sqlite writes happen per-toggle
  }, [checked]);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 24 }}
    >
      <Modal visible={dbDumpVisible} animationType="slide" onRequestClose={() => setDbDumpVisible(false)}>
        <ThemedView style={{ flex: 1, paddingTop: 18, paddingHorizontal: 16, paddingBottom: 16 }}>
          <ThemedView style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <ThemedText type="subtitle">SQLite Dump</ThemedText>
            <Pressable
              onPress={() => {
                setDbDumpVisible(false);
              }}
              style={{ paddingHorizontal: 10, paddingVertical: 6 }}
            >
              <ThemedText>Close</ThemedText>
            </Pressable>
          </ThemedView>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
            <ThemedText style={{ fontSize: 12, lineHeight: 16 }} selectable>
              {dbDump || '(empty)'}
            </ThemedText>
          </ScrollView>
        </ThemedView>
      </Modal>
      <View style={{ height: 24 }} />
      <ThemedView style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12, gap: 10 }}>
        <Pressable
          onPress={() => {
            resetChecked();
          }}
          style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(127,127,127,0.25)' }}
        >
          <ThemedText>Clear All</ThemedText>
        </Pressable>
        <Pressable
          onPress={exportSqlDump}
          style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(127,127,127,0.25)' }}
        >
          <ThemedText>{exporting ? 'Exporting…' : 'Export SQL'}</ThemedText>
        </Pressable>
        <Pressable
          onPress={handleShowDbDump}
          style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(127,127,127,0.25)' }}
        >
          <ThemedText>{dumpingDb ? 'Loading DB…' : 'Show DB'}</ThemedText>
        </Pressable>
      </ThemedView>
      <ThemedView style={{ padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(127,127,127,0.25)' }}>
        <ThemedView style={styles.titleContainer}>
          <ThemedView style={styles.todoCard}>
            <ThemedText type="subtitle">Todo</ThemedText>
            <ThemedView style={styles.todoList}>
              {ITEMS.map((title, idx) => {
                const isChecked = !!checked[idx];
                return (
                  <Pressable
                    key={`${idx}-${title}`}
                    onPress={() => {
                      setChecked((prev) => {
                        const next = prev.map((v, i) => (i === idx ? !v : v));
                        const nextVal = next[idx];
                        ensureZikrTable(db)
                          .then(() => setZikrCheckedAt(db, idx, nextVal))
                          .catch((e) => console.log('Failed to persist zikr tick (sqlite):', e));
                        return next;
                      });
                    }}
                    style={styles.todoRow}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isChecked }}
                  >
                    <ThemedView style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                      <ThemedText style={styles.checkboxText}>{isChecked ? '✓' : ''}</ThemedText>
                    </ThemedView>
                    <ThemedView style={styles.todoTitleWrap}>
                      <ThemedText style={[styles.todoTitle, isChecked && styles.todoTitleDone]}>{title}</ThemedText>
                    </ThemedView>
                  </Pressable>
                );
              })}
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}
