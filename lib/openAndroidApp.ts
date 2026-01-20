import { Linking, Platform } from 'react-native';

export const openAndroidAppOrStore = async (packageName: string) => {
  if (Platform.OS !== 'android') return false;

  const pkg = String(packageName ?? '').trim();
  if (!pkg) return false;

  const androidApp = `android-app://${pkg}`;
  const intent = `intent://#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;launchFlags=0x10000000;package=${pkg};end`;
  const market = `market://details?id=${pkg}`;

  return Linking.openURL(androidApp)
    .then(() => true)
    .catch(() => Linking.openURL(intent).then(() => true))
    .catch(() => Linking.openURL(market).then(() => false))
    .catch(() => false);
};
