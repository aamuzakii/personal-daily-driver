import { NativeModules } from 'react-native';

const { UsageStats } = NativeModules as {
  UsageStats?: {
    getTwitterMinutes: () => Promise<number>;
    openUsageAccessSettings?: () => void;
  };
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

export const openUsageAccessSettings = (): void => {
  if (!UsageStats || typeof UsageStats.openUsageAccessSettings !== 'function') {
    throw new Error('UsageStats native module not available');
  }

  UsageStats.openUsageAccessSettings();
};

export default getTwitterMinutes