import notifee, { AndroidImportance } from '@notifee/react-native';
import {
    getMessaging,
    getToken,
    onMessage,
    registerDeviceForRemoteMessages,
    type RemoteMessage,
} from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

import { api } from '@/shared/services/api/api';

import { channelEnabled, loadPrefs, type NotifPrefs } from './prefs';

let androidChannelId: string | null = null;

async function ensureChannel(): Promise<string> {
  if (androidChannelId) return androidChannelId;
  androidChannelId = await notifee.createChannel({
    id: 'agrimate-default',
    name: 'AgriMate',
    importance: AndroidImportance.HIGH,
  });
  return androidChannelId;
}

export async function registerForPushIfNeeded(): Promise<void> {
  try {
    await notifee.requestPermission();
    if (Platform.OS === 'android') await ensureChannel();
    await registerFcmToken();
  } catch (e) {
    console.warn('Push registration failed', e);
  }
}

export async function notify(
  channel: keyof Omit<NotifPrefs, 'master'>,
  title: string,
  body: string,
): Promise<void> {
  const prefs = await loadPrefs();
  if (!channelEnabled(prefs, channel)) return;
  try {
    const channelId = Platform.OS === 'android' ? await ensureChannel() : undefined;
    await notifee.displayNotification({
      title,
      body,
      android: channelId ? { channelId, smallIcon: 'ic_launcher', pressAction: { id: 'default' } } : undefined,
    });
  } catch (e) {
    console.warn('Failed to display notification', e);
  }
}

async function registerFcmToken(): Promise<void> {
  try {
    const messaging = getMessaging();
    await registerDeviceForRemoteMessages(messaging);
    const token = await getToken(messaging);
    if (token) await api.post('/api/users/me/device-token', { token, platform: Platform.OS });
  } catch (e) {
    console.warn('FCM token registration failed', e);
  }
}

const CHANNEL_BY_TYPE: Record<string, keyof Omit<NotifPrefs, 'master'>> = {
  OUTBREAK: 'outbreak',
  REMINDER: 'reminder',
  QA_REPLY: 'qa',
  SYSTEM: 'app',
  NEWS: 'app',
  AGRONOMIST_APPROVED: 'app',
  AGRONOMIST_REJECTED: 'app',
  ACCOUNT_SUSPENDED: 'app',
  ACCOUNT_REACTIVATED: 'app',
};

export function listenForForegroundMessages(): () => void {
  return onMessage(getMessaging(), async (remoteMessage: RemoteMessage) => {
    const title = remoteMessage.notification?.title ?? 'AgriMate';
    const body = remoteMessage.notification?.body ?? '';
    const channel = CHANNEL_BY_TYPE[remoteMessage.data?.type as string] ?? 'app';
    await notify(channel, title, body);
  });
}
