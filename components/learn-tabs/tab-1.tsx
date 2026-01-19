import React from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function LearnTab1() {
  return (
    <ThemedView style={{ paddingVertical: 16 }}>
      <ThemedText>Tab 1 content</ThemedText>
    </ThemedView>
  );
}
