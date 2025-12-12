import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { getQuranMinutes, startBackgroundTracking, stopBackgroundTracking } from './usageStats';

const BACKGROUND_FETCH_TASK = 'quran-usage-tracking';
const TASK_INTERVAL_MINUTES = 5;

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    console.log('Background task: Fetching Quran usage...');
    
    const quranMinutes = await getQuranMinutes();
    console.log('Background task: Quran minutes:', quranMinutes);
    
    // Send to API
    const response = await fetch(`https://home-dashboard-lac.vercel.app/api/quran/${quranMinutes}/210`);
    console.log('Background task: API response status:', response.status);
    
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export const registerBackgroundTask = async () => {
  try {
    // Start native background tracking for more reliability
    startBackgroundTracking();
    
    // Also register expo background fetch as backup
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    if (isRegistered) {
      console.log('Background task already registered');
      return;
    }

    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 60 * TASK_INTERVAL_MINUTES, // 5 minutes in seconds
      stopOnTerminate: false, // Continue even if app is terminated
      startOnBoot: true, // Start on device boot
    });

    console.log('Background task registered successfully');
  } catch (error) {
    console.error('Failed to register background task:', error);
  }
};

export const unregisterBackgroundTask = async () => {
  try {
    stopBackgroundTracking();
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    console.log('Background task unregistered');
  } catch (error) {
    console.error('Failed to unregister background task:', error);
  }
};

export const checkBackgroundTaskStatus = async () => {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    
    console.log('Background fetch status:', status);
    console.log('Task registered:', isRegistered);
    
    return { status, isRegistered };
  } catch (error) {
    console.error('Failed to check background task status:', error);
    return { status: null, isRegistered: false };
  }
};
