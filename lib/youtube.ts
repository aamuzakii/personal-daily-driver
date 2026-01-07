import SHAHIHFIQIH_1 from './shahihfiqih-1.json';

import AsyncStorage from '@react-native-async-storage/async-storage';

const WATCHED_URLS = new Set<string>();

const WATCHED_STORAGE_KEY = 'youtube.watchedUrls.v1';

let watchedLoaded = false;

async function loadWatchedIfNeeded(): Promise<void> {
  if (watchedLoaded) return;
  watchedLoaded = true;
  try {
    const raw = await AsyncStorage.getItem(WATCHED_STORAGE_KEY);
    if (!raw) return;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    for (const u of parsed) {
      if (typeof u === 'string' && u) WATCHED_URLS.add(u);
    }
  } catch {
    // ignore
  }
}

async function persistWatched(): Promise<void> {
  try {
    await AsyncStorage.setItem(WATCHED_STORAGE_KEY, JSON.stringify(Array.from(WATCHED_URLS)));
  } catch {
    // ignore
  }
}

export async function markYoutubeUrlWatched(url: string): Promise<void> {
  if (!url) return;
  await loadWatchedIfNeeded();
  WATCHED_URLS.add(url);
  await persistWatched();
}

export async function resetWatchedYoutubeUrls(): Promise<void> {
  await loadWatchedIfNeeded();
  WATCHED_URLS.clear();
  await persistWatched();
}

export async function getWatchedYoutubeUrls(): Promise<string[]> {
  await loadWatchedIfNeeded();
  return Array.from(WATCHED_URLS);
}

export async function getRandomYoutubeVideoUrlFromChannel(): Promise<string> {
  const urls: unknown = SHAHIHFIQIH_1;
  const list: string[] = Array.isArray(urls) ? (urls as string[]) : [];
  const clean = list.filter((u) => typeof u === 'string' && (u.startsWith('http://') || u.startsWith('https://')));
  if (clean.length === 0) throw new Error('Empty json');

  await loadWatchedIfNeeded();

  const unwatched = clean.filter((u) => !WATCHED_URLS.has(u));
  const pool = unwatched.length > 0 ? unwatched : clean;
  const picked = pool[Math.floor(Math.random() * pool.length)];
  if (!picked) throw new Error('No URL available');
  await markYoutubeUrlWatched(picked);
  return picked;
}