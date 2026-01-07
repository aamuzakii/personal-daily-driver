import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Linking } from 'react-native';
import { WebView } from 'react-native-webview';

import { ThemedView } from '@/components/themed-view';

function intentToHttps(intentUrl: string): string | null {
  try {
    if (!intentUrl.startsWith('intent://')) return null;
    const withoutIntent = intentUrl.replace(/^intent:\/\//, 'https://');
    const cut = withoutIntent.split('#Intent')[0];
    return cut.length > 0 ? cut : null;
  } catch {
    return null;
  }
}

function extractYoutubeVideoId(inputUrl: string): string | null {
  try {
    const u = new URL(inputUrl);
    const host = u.hostname.replace(/^www\./, '');
    const isYoutube = host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be' || host === 'youtube-nocookie.com' || host === 'www.youtube-nocookie.com';
    if (!isYoutube) return null;

    if (host === 'youtu.be') return u.pathname.replace(/^\//, '') || null;
    if (u.pathname === '/watch') return u.searchParams.get('v');
    if (u.pathname.startsWith('/shorts/')) return u.pathname.replace('/shorts/', '').split('/')[0] || null;
    if (u.pathname.startsWith('/embed/')) return u.pathname.replace('/embed/', '').split('/')[0] || null;
    return null;
  } catch {
    return null;
  }
}

function buildYoutubeIframeHtml(videoId: string): string {
  const embedUrl = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0&modestbranding=1&playsinline=1&iv_load_policy=3`;
  return `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <style>
      html, body { margin: 0; padding: 0; background: #000; height: 100%; overflow: hidden; }
      iframe { border: 0; width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <iframe src="${embedUrl}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>
  </body>
</html>`;
}

export default function WebViewScreen() {
  const params = useLocalSearchParams<{ url?: string; title?: string }>();

  const rawUrl = useMemo(() => {
    const u = params?.url;
    if (typeof u === 'string' && u.length > 0) return intentToHttps(u) ?? u;
    return 'https://example.com';
  }, [params?.url]);

  const title = useMemo(() => {
    const t = params?.title;
    if (typeof t === 'string' && t.length > 0) return t;
    return 'Web';
  }, [params?.title]);

  const youtubeId = useMemo(() => extractYoutubeVideoId(rawUrl), [rawUrl]);

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen options={{ title }} />
      <WebView
        style={{ flex: 1 }}
        javaScriptEnabled
        domStorageEnabled
        allowsFullscreenVideo
        source={
          youtubeId
            ? { html: buildYoutubeIframeHtml(youtubeId), baseUrl: 'https://www.youtube-nocookie.com' }
            : { uri: rawUrl }
        }
        onShouldStartLoadWithRequest={(req) => {
          const nextUrl = String(req?.url ?? '');
          if (nextUrl.startsWith('http://') || nextUrl.startsWith('https://') || nextUrl.startsWith('about:')) {
            return true;
          }
          Linking.openURL(nextUrl).catch(() => {});
          return false;
        }}
      />
    </ThemedView>
  );
}
