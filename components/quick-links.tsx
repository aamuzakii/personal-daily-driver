import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type QuickLink = {
  label: string;
  url: string;
};

export function QuickLinks({ links }: { links: QuickLink[] }) {
  const router = useRouter();

  return (
    <ThemedView
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 10,
        marginBottom: 4,
      }}
    >
      {links.map((link) => (
        <Pressable
          key={link.label}
          onPress={() =>
            router.push({
              pathname: '/webview',
              params: { url: link.url, title: link.label },
            })
          }
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: 'rgba(127,127,127,0.25)',
          }}
          accessibilityRole="button"
        >
          <ThemedText style={{ fontSize: 12 }}>{link.label}</ThemedText>
        </Pressable>
      ))}
    </ThemedView>
  );
}