import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { useAppSelector } from '@/app/hooks';
import { Body, Card, ListRow, Screen, Title } from '@/shared/components/ui';
import { font, spacing } from '@/shared/theme/theme';
import { resolveImageUrl } from '@/shared/utils/format';

import { selectIsAuthenticated, selectUser } from '@/features/auth';
import { useColors } from '@/features/theme';
import type { MainStackParamList } from '@/navigation/types';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  return (
    <Screen scroll>
      <Title style={{ marginVertical: spacing.md }}>{t('settings.title')}</Title>

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

      <ListRow icon="language" title={t('settings.language')} subtitle={t('settings.languageDesc')} onPress={() => navigation.navigate('SettingsLanguage')} />
      <ListRow icon="color-palette" title={t('settings.mode')} subtitle={t('settings.modeDesc')} onPress={() => navigation.navigate('SettingsAppearance')} />
      <ListRow icon="notifications" title={t('settings.notifications')} subtitle={t('settings.notificationsDesc')} onPress={() => navigation.navigate('SettingsNotifications')} />
      <ListRow icon="person-circle" title={t('settings.account')} subtitle={t('settings.accountDesc')} onPress={() => navigation.navigate('SettingsAccount')} />
      <ListRow icon="information-circle" title={t('settings.about')} subtitle={t('settings.aboutDesc')} onPress={() => navigation.navigate('SettingsAbout')} />
    </Screen>
  );
}
