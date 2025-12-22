import { NativeModules } from 'react-native';

export type QuranWeekBreakdown = {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
  total: number;
};

const { UsageStats } = NativeModules as {
  UsageStats?: {
    getTwitterMinutes: () => Promise<number>;
    getQuranMinutes: () => Promise<number>;
    getQuranWeekBreakdown?: () => Promise<QuranWeekBreakdown>;
    openUsageAccessSettings?: () => void;
    startBackgroundTracking?: () => void;
    stopBackgroundTracking?: () => void;
  };
};

export const getQuranMinutes = async (): Promise<number> => {
  console.log('NativeModules keys:', Object.keys(NativeModules));
  console.log('UsageStats native module value:', UsageStats);

  if (!UsageStats || typeof UsageStats.getQuranMinutes !== 'function') {
    throw new Error('UsageStats native module not available');
  }

  const result = await UsageStats.getQuranMinutes();
  console.log('getQuranMinutes result from native:', result);
  return result;
};

export const getTwitterMinutes = async (): Promise<number> => {
  console.log('NativeModules keys:', Object.keys(NativeModules));
  console.log('UsageStats native module value:', UsageStats);

  if (!UsageStats || typeof UsageStats.getTwitterMinutes !== 'function') {
    throw new Error('UsageStats native module not available');
  }

  const result = await UsageStats.getTwitterMinutes();
  console.log('getTwitterMinutes result from native:', result);
  return result;
};

export const getQuranWeekBreakdown = async (): Promise<QuranWeekBreakdown> => {
  if (!UsageStats || typeof UsageStats.getQuranWeekBreakdown !== 'function') {
    throw new Error('UsageStats native module not available');
  }
  return UsageStats.getQuranWeekBreakdown();
};

export const openUsageAccessSettings = (): void => {
  if (!UsageStats || typeof UsageStats.openUsageAccessSettings !== 'function') {
    throw new Error('UsageStats native module not available');
  }

  UsageStats.openUsageAccessSettings();
};

export const startBackgroundTracking = (): void => {
  if (!UsageStats || typeof UsageStats.startBackgroundTracking !== 'function') {
    throw new Error('UsageStats native module not available');
  }

  UsageStats.startBackgroundTracking();
};

export const stopBackgroundTracking = (): void => {
  if (!UsageStats || typeof UsageStats.stopBackgroundTracking !== 'function') {
    throw new Error('UsageStats native module not available');
  }

  UsageStats.stopBackgroundTracking();
};

export default getTwitterMinutes