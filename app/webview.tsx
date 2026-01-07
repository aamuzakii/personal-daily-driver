import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { WebView } from 'react-native-webview';

import { ThemedView } from '@/components/themed-view';

export default function WebViewScreen() {
  const params = useLocalSearchParams<{ url?: string; title?: string }>();

  const url = useMemo(() => {
    const u = params?.url;
    if (typeof u === 'string' && u.length > 0) return u;
    return 'https://example.com';
  }, [params?.url]);

  const title = useMemo(() => {
    const t = params?.title;
    if (typeof t === 'string' && t.length > 0) return t;
    return 'Web';
  }, [params?.title]);

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen options={{ title }} />
      <WebView source={{ uri: url }} style={{ flex: 1 }} />
    </ThemedView>
  );
}
