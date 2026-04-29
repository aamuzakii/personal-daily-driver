import React from 'react';

import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function LearnTab7() {
  const router = useRouter();
  const buttons = [
    'nawaqidul islam',
    'Shifat Shalat',
    'Tafsir Firanda',
    'Action D',
    'Action E',
  ];

  return (
    <ThemedView style={{ paddingTop: 12, paddingBottom: 16 }}>
      <ThemedView
        style={{
          flexDirection: 'column',
          gap: 10,
          paddingHorizontal: 10,
        }}
      >
        <ThemedText type="subtitle">Extras</ThemedText>

        {buttons.map((label) => (
          <Pressable
            key={label}
            onPress={() => {
              // first button should navigate to a new route (not a modal)
              if (label === 'nawaqidul islam') {
                router.push('/nawaqidul-islam');
                return;
              }
              if (label === 'Shifat Shalat') {
                router.push('/shifat-shalat');
                return;
              }
              if (label === 'Tafsir Firanda') {
                router.push('/tafsir-firanda');
                return;
              }
              // placeholder handler for other actions

              console.log('Pressed', label);
            }}
            style={{
              backgroundColor: 'rgba(127,127,127,0.06)',
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderRadius: 8,
            }}
          >
            <View>
              <ThemedText>{label}</ThemedText>
            </View>
          </Pressable>
        ))}
      </ThemedView>
    </ThemedView>
  );
}
