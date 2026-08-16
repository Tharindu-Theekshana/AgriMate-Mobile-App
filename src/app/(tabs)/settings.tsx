import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Body, Card, ListRow, Screen, Title } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/context/ThemeContext';
import { font, spacing } from '@/theme/theme';
import { resolveImageUrl } from '@/utils/format';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const { user, isAuthenticated } = useAuth();

  return (
    <Screen scroll>
      <Title style={{ marginVertical: spacing.md }}>{t('settings.title')}</Title>

      {/* Identity header */}
      <Card style={{ alignItems: 'center', marginBottom: spacing.lg }}>
        <View
          style={{
            width: 84,
            height: 84,
            borderRadius: 42,
            backgroundColor: colors.pale,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}>
          {user?.profilePhotoUrl ? (
            <Image source={{ uri: resolveImageUrl(user.profilePhotoUrl) }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : (
            <Ionicons name={isAuthenticated ? 'person' : 'person-outline'} size={42} color={colors.primary} />
          )}
        </View>
        <Text style={{ fontSize: font.xl, fontWeight: '800', color: colors.ink, marginTop: spacing.sm }}>
          {isAuthenticated ? user?.name : t('guest.badge')}
        </Text>
        {isAuthenticated ? (
          <Body muted style={{ fontSize: font.sm }}>@{user?.username} · {user?.email}</Body>
        ) : (
          <Body muted style={{ fontSize: font.sm, textAlign: 'center' }}>{t('auth.guestNote')}</Body>
        )}
      </Card>

      <ListRow icon="language" title={t('settings.language')} subtitle={t('settings.languageDesc')} onPress={() => router.push('/settings/language')} />
      <ListRow icon="color-palette" title={t('settings.mode')} subtitle={t('settings.modeDesc')} onPress={() => router.push('/settings/appearance')} />
      <ListRow icon="calendar" title={t('settings.events')} subtitle={t('settings.eventsDesc')} disabled />
      <ListRow icon="notifications" title={t('settings.notifications')} subtitle={t('settings.notificationsDesc')} onPress={() => router.push('/settings/notifications')} />
      <ListRow icon="person-circle" title={t('settings.account')} subtitle={t('settings.accountDesc')} onPress={() => router.push('/settings/account')} />
      <ListRow icon="information-circle" title={t('settings.about')} subtitle={t('settings.aboutDesc')} onPress={() => router.push('/settings/about')} />
    </Screen>
  );
}
