import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

import { loadZikrChecked, openAppDb } from '@/lib/resetMark';

const OBLIGATION_TASK = 'obligation-checker';
const ONE_HOUR_SECONDS = 60 * 60;

async function ensureNotificationPermission() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const res = await Notifications.requestPermissionsAsync();
  return res.status === 'granted';
}

function isWithinWindow(now = new Date()) {
  // works between 15:30 (inclusive) and 18:00 (exclusive)
  const start = new Date(now);
  start.setHours(15, 30, 0, 0);
  const end = new Date(now);
  end.setHours(18, 0, 0, 0);
  return now.getTime() >= start.getTime() && now.getTime() < end.getTime();
}

TaskManager.defineTask(OBLIGATION_TASK, async () => {
  try {
    const now = new Date();
    if (!isWithinWindow(now)) {
      // outside the required time window
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const db = openAppDb();
    const map = await loadZikrChecked(db);
    let anyChecked = false;
    for (const v of map.values()) {
      if (v) {
        anyChecked = true;
        break;
      }
    }

    if (anyChecked) return BackgroundFetch.BackgroundFetchResult.NoData;

    // nothing checked -> send local notification
    const ok = await ensureNotificationPermission();
    if (!ok) return BackgroundFetch.BackgroundFetchResult.NoData;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Reminder: Zikir not completed',
        body: "It looks like you haven't completed your Zikir for this period. Please perform your obligation.",
        sound: true,
      },
      trigger: null,
    });

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (e) {
    console.error('Obligation checker task failed:', e);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerObligationChecker() {
  try {
    const isRegistered =
      await TaskManager.isTaskRegisteredAsync(OBLIGATION_TASK);
    if (isRegistered) return;

    await BackgroundFetch.registerTaskAsync(OBLIGATION_TASK, {
      minimumInterval: ONE_HOUR_SECONDS,
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log('Obligation checker registered');
  } catch (e) {
    console.error('Failed to register obligation checker:', e);
  }
}

export async function unregisterObligationChecker() {
  try {
    const isRegistered =
      await TaskManager.isTaskRegisteredAsync(OBLIGATION_TASK);
    if (!isRegistered) return;
    await BackgroundFetch.unregisterTaskAsync(OBLIGATION_TASK);
    console.log('Obligation checker unregistered');
  } catch (e) {
    console.error('Failed to unregister obligation checker:', e);
  }
}
