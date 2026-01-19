import React, { useMemo, useState } from 'react';

import { Pressable } from 'react-native';

import LearnTab1 from '@/components/learn-tabs/tab-1';
import LearnTab2 from '@/components/learn-tabs/tab-2';
import LearnTab3 from '@/components/learn-tabs/tab-3';
import LearnTab4 from '@/components/learn-tabs/tab-4';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function LearnScreen() {
  const tabs = useMemo(() => ['Tab 1', 'Tab 2', 'Tab 3', 'Tab 4'] as const, []);
  const [active, setActive] = useState<(typeof tabs)[number]>('Tab 1');

  const content = useMemo(() => {
    if (active === 'Tab 1') return <LearnTab1 />;
    if (active === 'Tab 2') return <LearnTab2 />;
    if (active === 'Tab 3') return <LearnTab3 />;
    return <LearnTab4 />;
  }, [active]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <ThemedView
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingHorizontal: 18,
            paddingBottom: 14,
          }}
        >
          <ThemedText type="title" style={{ textAlign: 'center' }}>
            Learn
          </ThemedText>
        </ThemedView>
      }
    >
      <ThemedView
        style={{ paddingHorizontal: 16, paddingTop: 0, marginTop: -28 }}
      >
        <ThemedView
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(127,127,127,0.25)',
          }}
        >
          {tabs.map((t) => {
            const isActive = t === active;
            return (
              <Pressable
                key={t}
                onPress={() => setActive(t)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderTopLeftRadius: 10,
                  borderTopRightRadius: 10,
                  borderWidth: 1,
                  borderColor: isActive
                    ? 'rgba(127,127,127,0.35)'
                    : 'rgba(127,127,127,0.25)',
                  borderBottomWidth: isActive ? 0 : 1,
                  backgroundColor: isActive
                    ? 'rgba(127,127,127,0.10)'
                    : 'rgba(127,127,127,0.04)',
                  marginRight: 6,
                  zIndex: isActive ? 2 : 1,
                }}
              >
                <ThemedText
                  style={{ fontSize: 13, opacity: isActive ? 1 : 0.8 }}
                >
                  {t}
                </ThemedText>
              </Pressable>
            );
          })}
        </ThemedView>

        {content}
      </ThemedView>
    </ParallaxScrollView>
  );
}
