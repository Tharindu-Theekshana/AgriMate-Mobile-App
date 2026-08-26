import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotifPrefs {
  master: boolean;
  app: boolean;       
  outbreak: boolean;  
  reminder: boolean;  
  qa: boolean;       
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

export function channelEnabled(prefs: NotifPrefs, channel: keyof Omit<NotifPrefs, 'master'>): boolean {
  return prefs.master && prefs[channel];
}
