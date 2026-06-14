import React from 'react';

import { Platform } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const SCAN_LOOP_DELAY_MS = 600;

// --- Tag UID → card name mapping (edit these with your real tag IDs) ---
const TAG_UID_MAP: Record<string, string> = {
  '040DF8CAC12191': 'wolf',
  '040DF8CAC12190': 'bucket',
  '04A1B2C3D6': 'jibal',
  '04A1B2C3D7': 'siang',
};
// ------------------------------------------------------------------------

export default function LearnTab8() {
  const [lastWord, setLastWord] = React.useState('');
  const [lastTagId, setLastTagId] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'scanning' | 'found'>(
    'idle',
  );

  const soundsRef = React.useRef<Map<string, any>>(new Map());
  const scanningRef = React.useRef(false);
  const cancelledRef = React.useRef(false);
  const scanLoopRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const log = React.useCallback((msg: string) => {
    console.log(`[NFC] ${msg}`);
  }, []);

  const loadSounds = React.useCallback(async () => {
    try {
      const mod: any = await import('expo-av');
      const Audio = mod?.Audio;
      if (!Audio) return;

      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

      const pairs: [string, any][] = [
        ['wolf', require('../../audio/wolf.mp3')],
        ['bucket', require('../../audio/bucket.mp3')],
        ['jibal', require('../../audio/jibal.mp3')],
        ['siang', require('../../audio/siang.mp3')],
      ];

      const map = new Map<string, any>();
      for (const [key, src] of pairs) {
        try {
          const { sound } = await Audio.Sound.createAsync(src, {
            shouldPlay: false,
          });
          map.set(key, sound);
          log(`Loaded: ${key}.mp3`);
        } catch {
          log(`Failed to load: ${key}.mp3`);
        }
      }
      soundsRef.current = map;
    } catch {
      log('Failed to load audio system');
    }
  }, [log]);

  const playSound = React.useCallback(
    async (key: string) => {
      const sound = soundsRef.current.get(key);
      if (!sound) {
        log(`No sound loaded for: ${key}`);
        return;
      }
      try {
        await sound.replayAsync();
      } catch {}
    },
    [log],
  );

  const handleTagId = React.useCallback(
    async (tagId: string) => {
      const sanitized = tagId.trim().toUpperCase();
      if (!sanitized) return;

      setLastTagId(sanitized);
      log(`Tag ID: ${sanitized}`);

      const word = TAG_UID_MAP[sanitized];
      if (word) {
        setLastWord(word);
        setStatus('found');
        log(`Matched: ${word}`);

        playSound(word);
      } else {
        setLastWord('');
        setStatus('found');
        log(`Unknown tag: ${sanitized}`);
      }
    },
    [playSound, log],
  );

  const doOneScan = React.useCallback(async (): Promise<boolean> => {
    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);
      const tag = await NfcManager.getTag();
      console.log('[NFC] tag=', JSON.stringify(tag, null, 2));

      const tagId: string | undefined = tag?.id;
      if (tagId) {
        await handleTagId(tagId);
        return true;
      }
      log('No tag ID');
      return false;
    } catch (error) {
      log(`Scan error: ${error}`);
      return false;
    } finally {
      try {
        await NfcManager.cancelTechnologyRequest();
      } catch {}
    }
  }, [handleTagId, log]);

  const stopScanLoop = React.useCallback(() => {
    scanningRef.current = false;
    cancelledRef.current = true;
    setStatus('idle');
    if (scanLoopRef.current) {
      clearTimeout(scanLoopRef.current);
      scanLoopRef.current = null;
    }
  }, []);

  const startScanLoop = React.useCallback(async () => {
    if (scanningRef.current) return;
    scanningRef.current = true;
    cancelledRef.current = false;
    setStatus('scanning');
    log('Scan loop started');

    const loop = async () => {
      while (scanningRef.current && !cancelledRef.current) {
        await doOneScan();
        if (!scanningRef.current || cancelledRef.current) break;
        await new Promise<void>((resolve) => {
          scanLoopRef.current = setTimeout(resolve, SCAN_LOOP_DELAY_MS);
        });
      }
    };

    void loop();
  }, [doOneScan, log]);

  React.useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      try {
        log('Starting NFC...');
        await NfcManager.start();

        const isSupported =
          Platform.OS === 'web' ? false : await NfcManager.isSupported();
        if (cancelled) return;

        if (!isSupported) {
          log('NFC not supported');
          return;
        }

        const isEnabled =
          Platform.OS === 'android' || Platform.OS === 'ios'
            ? await NfcManager.isEnabled()
            : false;

        if (cancelled) return;

        if (!isEnabled) {
          log('NFC not enabled');
          return;
        }

        await loadSounds();

        if (!cancelled) {
          void startScanLoop();
        }
      } catch (error) {
        log(`Setup error: ${error}`);
      }
    };

    void setup();

    return () => {
      cancelled = true;
      stopScanLoop();
      for (const sound of soundsRef.current.values()) {
        void sound.unloadAsync().catch(() => {});
      }
      soundsRef.current.clear();
    };
  }, [loadSounds, log, startScanLoop, stopScanLoop]);

  const isScanning = status === 'scanning';
  const hasCard = lastTagId !== '';

  return (
    <ThemedView
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 40,
        gap: 28,
      }}
    >
      {/* Scan indicator ring */}
      <ThemedView
        style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isScanning
            ? 'rgba(59,130,246,0.12)'
            : 'rgba(127,127,127,0.08)',
          borderWidth: 2,
          borderColor: isScanning
            ? 'rgba(59,130,246,0.45)'
            : 'rgba(127,127,127,0.25)',
        }}
      >
        <Ionicons
          name={isScanning ? 'radio-outline' : 'wifi-outline'}
          size={40}
          color={isScanning ? 'rgba(59,130,246,0.9)' : 'rgba(127,127,127,0.55)'}
        />
      </ThemedView>

      {/* Status text */}
      <ThemedView style={{ alignItems: 'center', gap: 6 }}>
        <ThemedText
          style={{
            fontSize: 18,
            fontWeight: '600',
            opacity: isScanning ? 1 : 0.5,
          }}
        >
          {isScanning ? 'Listening...' : 'Not scanning'}
        </ThemedText>
        <ThemedText style={{ fontSize: 13, opacity: 0.6 }}>
          Hold a vocab card near the device
        </ThemedText>
      </ThemedView>

      {/* Last card display */}
      {hasCard && (
        <ThemedView
          style={{
            paddingVertical: 16,
            paddingHorizontal: 28,
            borderRadius: 20,
            backgroundColor: 'rgba(59,130,246,0.10)',
            borderWidth: 1,
            borderColor: 'rgba(59,130,246,0.30)',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <ThemedText style={{ fontSize: 12, opacity: 0.5 }}>Tag ID</ThemedText>
          <ThemedText
            style={{
              fontSize: 16,
              fontWeight: '600',
              fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
              opacity: 0.8,
            }}
          >
            {lastTagId}
          </ThemedText>
          {lastWord ? (
            <ThemedText
              style={{
                fontSize: 28,
                fontWeight: '700',
                textTransform: 'capitalize',
              }}
            >
              {lastWord}
            </ThemedText>
          ) : (
            <ThemedText style={{ fontSize: 13, opacity: 0.45 }}>
              Unknown tag
            </ThemedText>
          )}
        </ThemedView>
      )}

      {/* Empty state when no card yet */}
      {!hasCard && isScanning && (
        <ThemedView
          style={{
            paddingVertical: 16,
            paddingHorizontal: 28,
            borderRadius: 20,
            backgroundColor: 'rgba(127,127,127,0.04)',
            borderWidth: 1,
            borderColor: 'rgba(127,127,127,0.12)',
            borderStyle: 'dashed',
            alignItems: 'center',
          }}
        >
          <ThemedText style={{ fontSize: 14, opacity: 0.4 }}>
            No card scanned yet
          </ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
}
