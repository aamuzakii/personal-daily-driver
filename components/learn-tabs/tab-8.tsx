import React from 'react';

import { Platform } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import NfcManager, { Ndef, NfcTech } from 'react-native-nfc-manager';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type TagRecord = {
  tnf?: number;
  type?: string | number[];
  payload?: number[];
};

const SCAN_LOOP_DELAY_MS = 600;

export default function LearnTab8() {
  const [lastWord, setLastWord] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'scanning' | 'found'>(
    'idle',
  );

  const dummySoundRef = React.useRef<any>(null);
  const scanningRef = React.useRef(false);
  const cancelledRef = React.useRef(false);
  const scanLoopRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const log = React.useCallback((msg: string) => {
    console.log(`[NFC] ${msg}`);
  }, []);

  const loadDummySound = React.useCallback(async () => {
    try {
      const mod: any = await import('expo-av');
      const Audio = mod?.Audio;
      if (!Audio) return;

      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(
        require('../../audio/cheer1.mp3'),
        { shouldPlay: false },
      );
      dummySoundRef.current = sound;
    } catch {
      log('Failed to load dummy sound');
    }
  }, [log]);

  const playDummySound = React.useCallback(async () => {
    const sound = dummySoundRef.current;
    if (!sound) return;
    try {
      await sound.replayAsync();
    } catch {}
  }, []);

  const handleVocabWord = React.useCallback(
    async (word: string) => {
      const normalized = word.trim().toLowerCase();
      if (!normalized) return;

      setLastWord(normalized);
      setStatus('found');
      log(`Card: ${normalized}`);

      switch (normalized) {
        case 'wolf':
        case 'bucket':
          await playDummySound();
          break;
        default:
          break;
      }
    },
    [playDummySound, log],
  );

  const extractText = React.useCallback((records: TagRecord[] | undefined) => {
    if (!Array.isArray(records)) return '';

    for (const record of records) {
      const type = record?.type;
      const isTextRecord =
        record?.tnf === Ndef.TNF_WELL_KNOWN &&
        (type === Ndef.RTD_TEXT ||
          (Array.isArray(type) &&
            type.length === Ndef.RTD_BYTES_TEXT.length &&
            type.every(
              (value, index) => value === Ndef.RTD_BYTES_TEXT[index],
            )));

      if (!isTextRecord || !Array.isArray(record?.payload)) continue;

      try {
        return String((Ndef as any).text.decodePayload(record.payload));
      } catch {
        continue;
      }
    }

    return '';
  }, []);

  const doOneScan = React.useCallback(async (): Promise<boolean> => {
    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);
      const tag = await NfcManager.getTag();
      console.log('[NFC] tag=', JSON.stringify(tag, null, 2));

      if (tag?.ndefMessage) {
        const word = extractText(tag.ndefMessage);
        if (word) {
          await handleVocabWord(word);
          return true;
        }
        log('No text payload');
      } else {
        log('No NDEF message');
      }
      return false;
    } catch (error) {
      log(`Scan error: ${error}`);
      return false;
    } finally {
      try {
        await NfcManager.cancelTechnologyRequest();
      } catch {}
    }
  }, [extractText, handleVocabWord, log]);

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

        await loadDummySound();

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
      const sound = dummySoundRef.current;
      dummySoundRef.current = null;
      if (sound) void sound.unloadAsync().catch(() => {});
    };
  }, [loadDummySound, log, startScanLoop, stopScanLoop]);

  const isScanning = status === 'scanning';
  const hasCard = lastWord !== '';

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
          color={
            isScanning
              ? 'rgba(59,130,246,0.9)'
              : 'rgba(127,127,127,0.55)'
          }
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
          <ThemedText style={{ fontSize: 12, opacity: 0.5 }}>
            Last card
          </ThemedText>
          <ThemedText
            style={{
              fontSize: 28,
              fontWeight: '700',
              textTransform: 'capitalize',
            }}
          >
            {lastWord}
          </ThemedText>
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

