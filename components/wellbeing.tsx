import { styles } from '@/constants/styles'
import React from 'react'
import { ActivityIndicator, Button, Pressable } from 'react-native'
import { ThemedText } from './themed-text'
import { ThemedView } from './themed-view'

const Wellbeing = ({handleLoadQuranUsage, quranMinutes, loadingUsage, quranWeek, loadQuranWeek, handleLoadUsage, twitterMinutes, usageError, backgroundTaskStatus, handleOpenSettings, handleOpenUsageAccessSettings}: any) => {
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

        <ThemedView style={styles.weekHeaderRow}>
          <ThemedText type="defaultSemiBold">Quran this week (Mon–Sun)</ThemedText>
          <Pressable onPress={loadQuranWeek} disabled={loadingUsage} style={styles.refreshButton}>
            <ThemedText type="link">{loadingUsage ? 'Loading…' : 'Refresh'}</ThemedText>
          </Pressable>
        </ThemedView>

        {quranWeek && !loadingUsage && (
          <ThemedView style={styles.weekGrid}>
            <ThemedView style={styles.weekRow}>
              <ThemedText style={styles.weekLabel}>Mon</ThemedText>
              <ThemedText style={styles.weekValue}>{quranWeek.monday} min</ThemedText>
            </ThemedView>
            <ThemedView style={styles.weekRow}>
              <ThemedText style={styles.weekLabel}>Tue</ThemedText>
              <ThemedText style={styles.weekValue}>{quranWeek.tuesday} min</ThemedText>
            </ThemedView>
            <ThemedView style={styles.weekRow}>
              <ThemedText style={styles.weekLabel}>Wed</ThemedText>
              <ThemedText style={styles.weekValue}>{quranWeek.wednesday} min</ThemedText>
            </ThemedView>
            <ThemedView style={styles.weekRow}>
              <ThemedText style={styles.weekLabel}>Thu</ThemedText>
              <ThemedText style={styles.weekValue}>{quranWeek.thursday} min</ThemedText>
            </ThemedView>
            <ThemedView style={styles.weekRow}>
              <ThemedText style={styles.weekLabel}>Fri</ThemedText>
              <ThemedText style={styles.weekValue}>{quranWeek.friday} min</ThemedText>
            </ThemedView>
            <ThemedView style={styles.weekRow}>
              <ThemedText style={styles.weekLabel}>Sat</ThemedText>
              <ThemedText style={styles.weekValue}>{quranWeek.saturday} min</ThemedText>
            </ThemedView>
            <ThemedView style={styles.weekRow}>
              <ThemedText style={styles.weekLabel}>Sun</ThemedText>
              <ThemedText style={styles.weekValue}>{quranWeek.sunday} min</ThemedText>
            </ThemedView>

            <ThemedView style={styles.totalRow}>
              <ThemedText type="defaultSemiBold">Total</ThemedText>
              <ThemedText type="defaultSemiBold">{quranWeek.total} min</ThemedText>
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