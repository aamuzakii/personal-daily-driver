import React from 'react';

import { Platform, Pressable, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import NfcManager, { Ndef, NfcTech } from 'react-native-nfc-manager';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type TagRecord = {
  tnf?: number;
  type?: string | number[];
  payload?: number[];
};

const SCAN_LOOP_DELAY_MS = 800;

export default function LearnTab8() {
  const [scanning, setScanning] = React.useState(false);
  const [lastWord, setLastWord] = React.useState('');
  const [status, setStatus] = React.useState('Preparing NFC reader...');
  const [logs, setLogs] = React.useState<string[]>(['App started']);

  const dummySoundRef = React.useRef<any>(null);
  const scanningRef = React.useRef(false);
  const cancelledRef = React.useRef(false);

  const addLog = React.useCallback((msg: string) => {
    console.log(`[NFC] ${msg}`);
    setLogs((prev) => [
      ...prev.slice(-9),
      `${new Date().toLocaleTimeString()}: ${msg}`,
    ]);
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
      addLog('Loaded dummy sound');
    } catch {
      addLog('Failed to load dummy sound');
    }
  }, [addLog]);

  const playDummySound = React.useCallback(async () => {
    const sound = dummySoundRef.current;
    if (!sound) return;
    try {
      await sound.replayAsync();
      addLog('Played dummy sound');
    } catch {
      addLog('Failed to play dummy sound');
    }
  }, [addLog]);

  const handleVocabWord = React.useCallback(
    async (word: string) => {
      const normalized = word.trim().toLowerCase();
      if (!normalized) return;

      setLastWord(normalized);
      addLog(`Card scanned: ${normalized}`);

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
    [playDummySound, addLog],
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

  // Core scan: requestTechnology → getTag → auto-re-arm
  const doOneScan = React.useCallback(async (): Promise<boolean> => {
    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);
      addLog('requestTechnology acquired');
      const tag = await NfcManager.getTag();
      console.log('[NFC] tag=', JSON.stringify(tag, null, 2));

      if (tag?.ndefMessage) {
        const word = extractText(tag.ndefMessage);
        if (word) {
          addLog(`Tag received: ${word}`);
          await handleVocabWord(word);
          return true;
        }
        addLog('Tag OK but no text payload');
        setStatus('Tag detected but no text payload.');
      } else {
        addLog('Tag OK but no NDEF message');
        setStatus('Tag detected but no NDEF message.');
      }
      return false;
    } catch (error) {
      addLog(`Scan error: ${error}`);
      setStatus('Scan error. Tap button again.');
      return false;
    } finally {
      try {
        await NfcManager.cancelTechnologyRequest();
      } catch {}
    }
  }, [extractText, handleVocabWord, addLog]);

  const scanLoopRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const startScanLoop = React.useCallback(async () => {
    if (scanningRef.current) return;
    scanningRef.current = true;
    setScanning(true);
    cancelledRef.current = false;
    addLog('Scan loop started');
    setStatus('Hold a card near the device...');

    const loop = async () => {
      while (scanningRef.current && !cancelledRef.current) {
        await doOneScan();
        if (!scanningRef.current || cancelledRef.current) break;
        addLog('Waiting for next card...');
        setStatus('Ready for next card...');
        await new Promise<void>((resolve) => {
          scanLoopRef.current = setTimeout(resolve, SCAN_LOOP_DELAY_MS);
        });
      }
    };

    void loop();
  }, [doOneScan, addLog]);

  const stopScanLoop = React.useCallback(() => {
    scanningRef.current = false;
    cancelledRef.current = true;
    setScanning(false);
    if (scanLoopRef.current) {
      clearTimeout(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    addLog('Scan loop stopped');
    setStatus('Scan loop stopped.');
  }, [addLog]);

  React.useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      try {
        addLog('Calling NfcManager.start()');
        await NfcManager.start();

        const isSupported =
          Platform.OS === 'web' ? false : await NfcManager.isSupported();
        if (cancelled) return;
        addLog(`Supported: ${isSupported}`);

        if (!isSupported) {
          setStatus('NFC is not supported on this device.');
          return;
        }

        const isEnabled =
          Platform.OS === 'android' || Platform.OS === 'ios'
            ? await NfcManager.isEnabled()
            : false;

        if (cancelled) return;
        addLog(`Enabled: ${isEnabled}`);

        if (!isEnabled) {
          setStatus('Turn on NFC to scan vocab cards.');
          return;
        }

        await loadDummySound();
        setStatus('Ready. Tap "Scan NFC Card" to start.');
      } catch (error) {
        addLog(`Setup error: ${error}`);
        console.log('Failed to start NFC learn tab:', error);
        if (!cancelled) {
          setStatus('Unable to start NFC scanning on this device.');
        }
      }
    };

    void setup();

    return () => {
      cancelled = true;
      cancelledRef.current = true;
      scanningRef.current = false;
      if (scanLoopRef.current) {
        clearTimeout(scanLoopRef.current);
        scanLoopRef.current = null;
      }

      const sound = dummySoundRef.current;
      dummySoundRef.current = null;
      if (sound) void sound.unloadAsync().catch(() => {});
    };
  }, [loadDummySound, addLog]);

  const toggleScan = React.useCallback(() => {
    if (scanningRef.current) {
      stopScanLoop();
    } else {
      void startScanLoop();
    }
  }, [stopScanLoop, startScanLoop]);

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
          {scanning ? 'Scanning' : 'Idle'}
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
              Tap the button, then hold a vocab card near the device.
            </ThemedText>
          </View>
        </ThemedView>

        <ThemedText style={{ fontSize: 13, lineHeight: 18 }}>
          Status: {status}
        </ThemedText>

        <ThemedText style={{ fontSize: 13, lineHeight: 18 }}>
          Last card: {lastWord || 'none yet'}
        </ThemedText>

        <ThemedView style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <Pressable
            onPress={toggleScan}
            style={{
              flex: 1,
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 999,
              backgroundColor: scanning
                ? 'rgba(234,67,53,0.18)'
                : 'rgba(59,130,246,0.18)',
              borderWidth: 1,
              borderColor: scanning
                ? 'rgba(234,67,53,0.55)'
                : 'rgba(59,130,246,0.55)',
              alignItems: 'center',
            }}
          >
            <ThemedText style={{ fontSize: 13, fontWeight: '600' }}>
              {scanning ? 'Stop Scanning' : 'Scan NFC Card'}
            </ThemedText>
          </Pressable>
        </ThemedView>

        <ThemedText
          style={{
            fontSize: 11,
            lineHeight: 14,
            opacity: 0.6,
            fontStyle: 'italic',
          }}
        >
          Uses requestTechnology(). Tap button → hold card → auto re-arms for
          next card until stopped.
        </ThemedText>

        <ThemedView
          style={{
            marginTop: 12,
            padding: 10,
            borderRadius: 10,
            backgroundColor: 'rgba(0,0,0,0.04)',
            maxHeight: 180,
          }}
        >
          <ThemedText style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>
            Debug logs (latest):
          </ThemedText>
          <View style={{ flexDirection: 'column', gap: 2 }}>
            {logs.map((log, idx) => (
              <ThemedText
                key={idx}
                style={{
                  fontSize: 11,
                  fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                  opacity: 0.9,
                  lineHeight: 14,
                }}
              >
                {log}
              </ThemedText>
            ))}
          </View>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}
