import { styles } from '@/constants/styles'
import React from 'react'
import { ActivityIndicator, Button, Pressable } from 'react-native'
import { ThemedText } from './themed-text'
import { ThemedView } from './themed-view'

const Wellbeing = ({handleLoadQuranUsage, quranMinutes, loadingUsage, quranWeek, loadQuranWeek, handleLoadUsage, twitterMinutes, usageError, backgroundTaskStatus, handleOpenSettings, handleOpenUsageAccessSettings, combinedQuranWeek}: any) => {
  return       <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Chrome usage POC</ThemedText>
        <ThemedText>
          Press the button below to fetch your Chrome browser usage (last 24h) from the native module.
        </ThemedText>
        <Button title="Load Chrome minutes" onPress={handleLoadUsage} />
        {loadingUsage && <ActivityIndicator style={{ marginTop: 8 }} />}
        {twitterMinutes !== null && !loadingUsage && (
          <ThemedText>
            Chrome usage: {twitterMinutes} minutes
          </ThemedText>
        )}
        <Button title="Load Quran minutes" onPress={handleLoadQuranUsage} />
        {quranMinutes !== null && !loadingUsage && (
          <ThemedText>
            Quran usage: {quranMinutes} minutes
          </ThemedText>
        )}

        {/* Combined Quran week (SQLite DB / Android native) */}
        <ThemedView style={styles.weekHeaderRow}>
          <ThemedText type="defaultSemiBold">Quran this week (Mon–Sun)</ThemedText>
          <Pressable onPress={loadQuranWeek} disabled={loadingUsage} style={styles.refreshButton}>
            <ThemedText type="link">{loadingUsage ? 'Loading…' : 'Refresh'}</ThemedText>
          </Pressable>
        </ThemedView>

        {combinedQuranWeek && combinedQuranWeek.length > 0 && (
          <ThemedView style={styles.weekGrid}>
            {combinedQuranWeek.map((row: any) => (
              <ThemedView style={styles.weekRow} key={row.day}>
                <ThemedText style={styles.weekLabel}>{row.day}</ThemedText>
                <ThemedText style={styles.weekValue}>
                  {row.dbMinutes} min / {row.nativeMinutes} min
                </ThemedText>
              </ThemedView>
            ))}

            <ThemedView style={styles.totalRow}>
              <ThemedText type="defaultSemiBold">Total</ThemedText>
              <ThemedText type="defaultSemiBold">
                {combinedQuranWeek.reduce((s: number, r: any) => s + r.dbMinutes, 0)} min /{' '}
                {combinedQuranWeek.reduce((s: number, r: any) => s + r.nativeMinutes, 0)} min
              </ThemedText>
            </ThemedView>
          </ThemedView>
        )}

        {usageError && (
          <ThemedText style={{ color: 'red' }}>
            Error: {usageError}
          </ThemedText>
        )}
        <ThemedText>
          Background Task Status: {backgroundTaskStatus}
        </ThemedText>
        <Button title="Open app settings" onPress={handleOpenSettings} />
        <Button title="Grant usage access" onPress={handleOpenUsageAccessSettings} />
      </ThemedView>
}

export default Wellbeing