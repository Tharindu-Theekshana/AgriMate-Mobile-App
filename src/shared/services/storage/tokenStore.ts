import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS = 'agrimate.accessToken';
const REFRESH = 'agrimate.refreshToken';

const isWeb = Platform.OS === 'web';

async function set(key: string, value: string | null) {
  if (value === null) {
    return isWeb ? AsyncStorage.removeItem(key) : SecureStore.deleteItemAsync(key);
  }
  return isWeb ? AsyncStorage.setItem(key, value) : SecureStore.setItemAsync(key, value);
}

async function get(key: string): Promise<string | null> {
  return isWeb ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(key);
}

export const tokenStore = {
  getAccess: () => get(ACCESS),
  getRefresh: () => get(REFRESH),
  save: async (access: string, refresh: string) => {
    await set(ACCESS, access);
    await set(REFRESH, refresh);
  },
  clear: async () => {
    await set(ACCESS, null);
    await set(REFRESH, null);
  },
};
