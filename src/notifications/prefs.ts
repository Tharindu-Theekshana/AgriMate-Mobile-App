import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Local notification preferences. The "app" channel maps to FCM push
 * (registered users only); the rest gate locally-scheduled (notifee) notifications.
 */
export interface NotifPrefs {
  master: boolean;
  app: boolean;       // news / announcements (FCM, registered users)
  outbreak: boolean;  // nearby disease outbreaks
  reminder: boolean;  // crop-care / scan reminders
  qa: boolean;        // agronomist replies
}

export const DEFAULT_PREFS: NotifPrefs = {
  master: true,
  app: true,
  outbreak: true,
  reminder: true,
  qa: true,
};

const KEY = 'agrimate.notifPrefs';

export async function loadPrefs(): Promise<NotifPrefs> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function savePrefs(prefs: NotifPrefs): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(prefs));
}

/** Whether a given channel may notify, respecting the master switch. */
export function channelEnabled(prefs: NotifPrefs, channel: keyof Omit<NotifPrefs, 'master'>): boolean {
  return prefs.master && prefs[channel];
}
