import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Body, Card, Screen } from '@/components/ui';
import { useColors } from '@/context/ThemeContext';
import { font, spacing } from '@/theme/theme';

export default function AboutScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: t('about.title') }} />

      <View style={{ alignItems: 'center', marginVertical: spacing.xl }}>
        <View style={{ width: 88, height: 88, borderRadius: 24, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="leaf" size={44} color={colors.primary} />
        </View>
        <Text style={{ fontSize: font.xxl, fontWeight: '800', color: colors.ink, marginTop: spacing.md }}>{t('common.appName')}</Text>
        <Body muted>{t('about.tagline')}</Body>
        <Text style={{ color: colors.inkFaint, marginTop: 4, fontSize: font.sm }}>{t('about.version')} {version}</Text>
      </View>

      <Card style={{ marginBottom: spacing.lg }}>
        <Body>{t('about.body')}</Body>
      </Card>

      <Card style={{ backgroundColor: colors.pale, borderColor: colors.accent }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
          <Body style={{ flex: 1, marginLeft: spacing.sm, fontSize: font.sm }}>{t('about.disclaimer')}</Body>
        </View>
      </Card>
    </Screen>
  );
}
