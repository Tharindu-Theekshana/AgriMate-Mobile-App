import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en';
import si from './locales/si';
import ta from './locales/ta';

export const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'si', label: 'Sinhala', native: 'සිංහල' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

const STORAGE_KEY = 'agrimate.language';

function deviceLanguage(): LanguageCode {
  try {
    const code = getLocales()[0]?.languageCode;
    if (code === 'si' || code === 'ta') return code;
  } catch {
  }
  return 'en';
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, si: { translation: si }, ta: { translation: ta } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export async function bootstrapLanguage(): Promise<LanguageCode> {
  const saved = (await AsyncStorage.getItem(STORAGE_KEY)) as LanguageCode | null;
  const lang = saved ?? deviceLanguage();
  await i18n.changeLanguage(lang);
  return lang;
}

export async function setLanguage(code: LanguageCode) {
  await AsyncStorage.setItem(STORAGE_KEY, code);
  await i18n.changeLanguage(code);
}

export default i18n;
