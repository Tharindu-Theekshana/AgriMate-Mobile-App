import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text } from 'react-native';

import { apiErrorMessage } from '@/api/client';
import { userApi } from '@/api/endpoints';
import { Card, Screen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { LANGUAGES, setLanguage, type LanguageCode } from '@/i18n';
import { font, radius, spacing } from '@/theme/theme';

export default function LanguageScreen() {
  const { t, i18n } = useTranslation();
  const colors = useColors();
  const toast = useToast();
  const { isAuthenticated, setUser } = useAuth();
  const [lang, setLang] = useState<LanguageCode>((i18n.language as LanguageCode) ?? 'en');

  async function change(code: LanguageCode) {
    setLang(code);
    await setLanguage(code);
    if (isAuthenticated) {
      try {
        setUser(await userApi.update({ language: code }));
      } catch (e) {
        toast.error(apiErrorMessage(e));
      }
    }
  }

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: t('settings.language') }} />
      <Card style={{ padding: spacing.sm }}>
        {LANGUAGES.map((l, idx) => {
          const active = lang === l.code;
          return (
            <Pressable
              key={l.code}
              onPress={() => change(l.code)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: spacing.md,
                borderRadius: radius.md,
                backgroundColor: active ? colors.pale : 'transparent',
                marginBottom: idx < LANGUAGES.length - 1 ? 4 : 0,
              }}>
              <Text style={{ fontSize: font.md, fontWeight: '600', color: colors.ink }}>{l.native}</Text>
              {active ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
            </Pressable>
          );
        })}
      </Card>
    </Screen>
  );
}
