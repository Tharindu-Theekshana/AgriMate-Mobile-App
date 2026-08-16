import { Platform } from 'react-native';

/**
 * Backend base URL.
 * Override with EXPO_PUBLIC_API_URL (e.g. your machine's LAN IP for a physical phone:
 *   EXPO_PUBLIC_API_URL=http://192.168.1.5:8080 npx expo start)
 * Defaults: Android emulator → 10.0.2.2, otherwise localhost.
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080');
