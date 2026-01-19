import React, { useMemo, useState } from 'react';

import { Pressable } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function LearnScreen() {
  const tabs = useMemo(() => ['Tab 1', 'Tab 2', 'Tab 3', 'Tab 4'] as const, []);
  const [active, setActive] = useState<(typeof tabs)[number]>('Tab 1');

  const content = useMemo(() => {
    if (active === 'Tab 1') return 'Tab 1 content';
    if (active === 'Tab 2') return 'Tab 2 content';
    if (active === 'Tab 3') return 'Tab 3 content';
    return 'Tab 4 content';
  }, [active]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <ThemedView
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 18,
          }}
        >
          <ThemedText type="title" style={{ textAlign: 'center' }}>
            Learn
          </ThemedText>
        </ThemedView>
      }
    >
      <ThemedView style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <ThemedView style={{ flexDirection: 'row', gap: 8 }}>
          {tabs.map((t) => {
            const isActive = t === active;
            return (
              <Pressable
                key={t}
                onPress={() => setActive(t)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: isActive ? '#007AFF' : 'rgba(0,0,0,0.2)',
                  backgroundColor: isActive ? 'rgba(0,122,255,0.12)' : 'transparent',
                }}
              >
                <ThemedText style={{ fontSize: 13 }}>{t}</ThemedText>
              </Pressable>
            );
          })}
        </ThemedView>

        <ThemedView style={{ paddingVertical: 16 }}>
          <ThemedText>{content}</ThemedText>
        </ThemedView>
      </ThemedView>
    </ParallaxScrollView>
  );
}
