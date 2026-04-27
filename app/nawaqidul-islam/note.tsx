import React, { useEffect, useState } from 'react';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
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

  return (
    <ThemedView style={{ flex: 1 }}>
      <ThemedView
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 12,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(127,127,127,0.12)',
        }}
      >
        <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
          <ThemedText>Back</ThemedText>
        </Pressable>
        <ThemedText type="subtitle">Note</ThemedText>
        <Pressable
          onPress={() => {
            save();
            router.back();
          }}
          style={{ padding: 8 }}
        >
          <ThemedText>Save</ThemedText>
        </Pressable>
      </ThemedView>

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
            borderColor: 'rgba(127,127,127,0.12)',
            borderRadius: 8,
          }}
        />
      </ScrollView>
    </ThemedView>
  );
}
