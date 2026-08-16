/**
 * Notification facade.
 *
 * Local notifications use **notifee** and remote "app notifications" use **FCM**
 * (registered users only). Both are native modules that require a custom dev build
 * (not Expo Go), so every call is guarded — in Expo Go / web they no-op gracefully
 * instead of crashing. Build a dev client (`npx expo run:android`) to exercise them.
 */
import { Platform } from 'react-native';

import { api } from '@/api/client';
import { channelEnabled, loadPrefs, type NotifPrefs } from './prefs';

// Lazily resolve notifee so the bundle still loads where the native module is absent.
function getNotifee(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@notifee/react-native');
    return mod.default ?? mod;
  } catch {
    return null;
  }
}

let androidChannelId: string | null = null;

async function ensureChannel(notifee: any): Promise<string> {
  if (androidChannelId) return androidChannelId;
  const id: string = await notifee.createChannel({ id: 'agrimate-default', name: 'AgriMate' });
  androidChannelId = id;
  return id;
}

/** Request OS permission and (for registered users) register the FCM token with the backend. */
export async function registerForPushIfNeeded(): Promise<void> {
  const notifee = getNotifee();
  if (!notifee) return;
  try {
    await notifee.requestPermission();
    if (Platform.OS === 'android') await ensureChannel(notifee);
    await registerFcmToken();
  } catch {
    /* permission denied / unsupported */
  }
}

/** Display a local notification if the channel is enabled in the user's prefs. */
export async function notify(
  channel: keyof Omit<NotifPrefs, 'master'>,
  title: string,
  body: string,
): Promise<void> {
  const notifee = getNotifee();
  if (!notifee) return;
  const prefs = await loadPrefs();
  if (!channelEnabled(prefs, channel)) return;
  try {
    const channelId = Platform.OS === 'android' ? await ensureChannel(notifee) : undefined;
    await notifee.displayNotification({
      title,
      body,
      android: channelId ? { channelId, smallIcon: 'ic_launcher', pressAction: { id: 'default' } } : undefined,
    });
  } catch {
    /* no-op */
  }
}

/**
 * Obtain the FCM device token and send it to the backend so the server can push
 * app notifications. Requires @react-native-firebase/messaging + a configured
 * Firebase project; guarded so it no-ops until that native setup exists.
 */
async function registerFcmToken(): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const messaging = require('@react-native-firebase/messaging').default;
    await messaging().registerDeviceForRemoteMessages();
    const token = await messaging().getToken();
    if (token) await api.post('/api/users/me/device-token', { token, platform: Platform.OS });
  } catch {
    /* FCM not configured yet */
  }
}
