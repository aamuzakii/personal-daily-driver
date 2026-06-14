import React from 'react';

import { Platform, Pressable, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import NfcManager, { Ndef, NfcEvents } from 'react-native-nfc-manager';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type TagRecord = {
  tnf?: number;
  type?: string | number[];
  payload?: number[];
};

export default function LearnTab8() {
  const [supported, setSupported] = React.useState<boolean | null>(null);
  const [enabled, setEnabled] = React.useState<boolean | null>(null);
  const [listening, setListening] = React.useState(false);
  const [lastWord, setLastWord] = React.useState('');
  const [status, setStatus] = React.useState('Preparing NFC reader...');

  const dummySoundRef = React.useRef<any>(null);

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
      // ignore audio setup failures in non-native environments
    }
  }, []);

  const playDummySound = React.useCallback(async () => {
    const sound = dummySoundRef.current;
    if (!sound) return;
    try {
      await sound.replayAsync();
    } catch {
      // ignore playback failures
    }
  }, []);

  const handleVocabWord = React.useCallback(
    async (word: string) => {
      const normalized = word.trim().toLowerCase();
      if (!normalized) return;

      setLastWord(normalized);

      switch (normalized) {
        case 'wolf':
          setStatus('wolf found. Playing the dummy sound.');
          await playDummySound();
          break;
        case 'bucket':
          setStatus('bucket found. Playing the dummy sound.');
          await playDummySound();
          break;
        case 'bird':
          setStatus('Bird card detected.');
          break;
        case 'apple':
          setStatus('Apple card detected.');
          break;
        default:
          setStatus(`Unknown card: ${normalized}`);
          break;
      }
    },
    [playDummySound],
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

  React.useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      try {
        await NfcManager.start();

        const isSupported =
          Platform.OS === 'web' ? false : await NfcManager.isSupported();
        if (cancelled) return;
        setSupported(isSupported);

        if (!isSupported) {
          setStatus('NFC is not supported on this device.');
          return;
        }

        const isEnabled =
          Platform.OS === 'android' || Platform.OS === 'ios'
            ? await NfcManager.isEnabled()
            : false;

        if (cancelled) return;
        setEnabled(isEnabled);

        if (!isEnabled) {
          setStatus('Turn on NFC to scan vocab cards.');
          return;
        }

        await loadDummySound();

        NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag) => {
          const word = extractText(tag?.ndefMessage);
          if (!word) {
            setStatus('Tag detected, but no text payload was found.');
            return;
          }

          void handleVocabWord(word);
        });

        await NfcManager.registerTagEvent({
          alertMessage: 'Hold a vocab card near the device',
          invalidateAfterFirstRead: false,
          isReaderModeEnabled: true,
        });

        if (cancelled) return;
        setListening(true);
        setStatus('Listening for NFC vocab cards...');
      } catch (error) {
        console.log('Failed to start NFC learn tab:', error);
        if (!cancelled) {
          setStatus('Unable to start NFC scanning on this device.');
        }
      }
    };

    void setup();

    return () => {
      cancelled = true;
      setListening(false);
      NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
      void NfcManager.unregisterTagEvent().catch(() => {});

      const sound = dummySoundRef.current;
      dummySoundRef.current = null;
      if (sound) void sound.unloadAsync().catch(() => {});
    };
  }, [extractText, handleVocabWord, loadDummySound]);

  const onRetry = React.useCallback(() => {
    setStatus('Retry by reopening this tab after turning NFC on.');
  }, []);

  return (
    <ThemedView style={{ paddingTop: 12, paddingBottom: 16 }}>
      <ThemedView
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 10,
        }}
      >
        <ThemedText type="subtitle">Kids Vocab</ThemedText>
        <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
          {listening ? 'Scanning' : 'Idle'}
        </ThemedText>
      </ThemedView>

      <ThemedView
        style={{
          marginTop: 12,
          marginHorizontal: 10,
          padding: 14,
          borderRadius: 16,
          backgroundColor: 'rgba(127,127,127,0.08)',
          borderWidth: 1,
          borderColor: 'rgba(127,127,127,0.16)',
          gap: 10,
        }}
      >
        <ThemedView
          style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}
        >
          <ThemedView
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(127,127,127,0.14)',
            }}
          >
            <Ionicons
              name="school-outline"
              size={18}
              color="rgba(127,127,127,0.95)"
            />
          </ThemedView>
          <View style={{ flex: 1 }}>
            <ThemedText style={{ fontSize: 15, fontWeight: '600' }}>
              NFC vocab reader
            </ThemedText>
            <ThemedText style={{ fontSize: 13, opacity: 0.75 }}>
              Scan a card with a text payload like cat.
            </ThemedText>
          </View>
        </ThemedView>

        <ThemedText style={{ fontSize: 13, lineHeight: 18 }}>
          Status: {status}
        </ThemedText>

        <ThemedText style={{ fontSize: 13, lineHeight: 18 }}>
          Supported:{' '}
          {supported === null ? 'checking...' : supported ? 'yes' : 'no'}
        </ThemedText>

        <ThemedText style={{ fontSize: 13, lineHeight: 18 }}>
          NFC enabled:{' '}
          {enabled === null ? 'checking...' : enabled ? 'yes' : 'no'}
        </ThemedText>

        <ThemedText style={{ fontSize: 13, lineHeight: 18 }}>
          Last card: {lastWord || 'none yet'}
        </ThemedText>

        <Pressable
          onPress={onRetry}
          style={{
            marginTop: 2,
            alignSelf: 'flex-start',
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 999,
            backgroundColor: 'rgba(127,127,127,0.12)',
          }}
        >
          <ThemedText style={{ fontSize: 13 }}>Show retry hint</ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}
