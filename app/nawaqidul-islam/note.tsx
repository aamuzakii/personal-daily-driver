import React, { useEffect, useLayoutEffect, useState } from 'react';

import { useNavigation } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  loadLearnNawaqidNote,
  openAppDb,
  setLearnNawaqidNote,
} from '@/lib/resetMark';

export default function NawaqidulNoteScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const itemKey = String(params?.itemKey ?? '');

  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const db = openAppDb();
    (async () => {
      try {
        const n = await loadLearnNawaqidNote(db, itemKey);
        if (!cancelled) setNote(n ?? '');
      } catch (e) {
        console.log('Failed to load note', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [itemKey]);

  const save = async () => {
    try {
      const db = openAppDb();
      await setLearnNawaqidNote(db, itemKey, note ?? '');
    } catch (e) {
      console.log('Failed to save note', e);
    }
  };

  const navigation: any = useNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useLayoutEffect(() => {
    // put Save button into the native header (right side)
    navigation.setOptions({
      headerTitle: 'Note',
      headerRight: () => (
        <Pressable
          onPress={async () => {
            await save();
            try {
              router.back();
            } catch {}
          }}
          style={{ padding: 8 }}
        >
          <ThemedText>Save</ThemedText>
        </Pressable>
      ),
    });
  }, [navigation, note, colorScheme]);

  return (
    <ThemedView style={{ flex: 1 }}>
      {/* header moved to native header (back arrow + save) */}

      <ScrollView contentContainerStyle={{ padding: 12 }}>
        <TextInput
          multiline
          value={note}
          onChangeText={(t) => setNote(t)}
          onBlur={save}
          placeholder={loading ? 'Loading…' : 'Write your note here'}
          style={{
            minHeight: 200,
            textAlignVertical: 'top',
            padding: 8,
            borderWidth: 1,
            borderColor:
              colorScheme === 'dark'
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(127,127,127,0.12)',
            borderRadius: 8,
            backgroundColor: colorScheme === 'dark' ? '#222425' : '#ffffff',
            color:
              colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
          }}
        />
      </ScrollView>
    </ThemedView>
  );
}
