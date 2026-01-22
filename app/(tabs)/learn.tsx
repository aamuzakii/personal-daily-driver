import React, { useMemo, useState } from 'react';

import { Pressable, ScrollView } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

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

  type IoniconName = keyof typeof Ionicons.glyphMap;
  const tabIcons = useMemo<IoniconName[]>(
    () => [
      'logo-chrome',
      'logo-github',
      'logo-react',
      'logo-firebase',
      'planet-outline',
      'code-slash-outline',
      'sparkles-outline',
      'extension-puzzle-outline',
    ],
    [],
  );

  const pickIcon = (t: (typeof tabs)[number]) => {
    let sum = 0;
    for (let i = 0; i < t.length; i += 1) sum += t.charCodeAt(i);
    return tabIcons[sum % tabIcons.length];
  };

  const content = useMemo(() => {
    if (active === 'Tab 1') return <LearnTab1 />;
    if (active === 'Tab 2') return <LearnTab2 />;
    if (active === 'Tab 3') return <LearnTab3 />;
    return <LearnTab4 />;
  }, [active]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerHeight={140}
      headerImage={
        <ThemedView
          style={{
            // maxHeight: 120,
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
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(127,127,127,0.30)',
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              paddingHorizontal: 6,
              paddingTop: 6,
            }}
          >
            {tabs.map((t) => {
              const isActive = t === active;
              return (
                <Pressable
                  key={t}
                  onPress={() => setActive(t)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    paddingLeft: 10,
                    paddingRight: 8,
                    paddingVertical: 8,
                    height: 36,
                    borderTopLeftRadius: 12,
                    borderTopRightRadius: 12,
                    borderWidth: 1,
                    borderColor: isActive
                      ? 'rgba(127,127,127,0.38)'
                      : 'rgba(127,127,127,0.26)',
                    borderBottomWidth: isActive ? 0 : 1,
                    backgroundColor: isActive
                      ? 'rgba(127,127,127,0.12)'
                      : 'rgba(127,127,127,0.05)',
                    marginRight: 8,
                    zIndex: isActive ? 3 : 1,
                  }}
                >
                  <ThemedView
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isActive
                        ? 'rgba(127,127,127,0.14)'
                        : 'rgba(127,127,127,0.10)',
                    }}
                  >
                    <Ionicons
                      name={pickIcon(t)}
                      size={12}
                      color={'rgba(127,127,127,0.95)'}
                    />
                  </ThemedView>
                  <ThemedText
                    style={{ fontSize: 13, opacity: isActive ? 1 : 0.82 }}
                  >
                    {t}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </ThemedView>

        {content}
      </ThemedView>
    </ParallaxScrollView>
  );
}
