import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useAppSelector } from '@/app/hooks';
import { Body, Button, Title } from '@/shared/components/ui';
import { spacing } from '@/shared/theme/theme';

import { useColors } from '@/features/theme';
import type { MainStackParamList } from '@/navigation/types';
import { selectIsAuthenticated } from '../store/auth.selectors';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { t } = useTranslation();
  const colors = useColors();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  if (isAuthenticated) return <>{children}</>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
      <Ionicons name="lock-closed" size={56} color={colors.inkFaint} />
      <Title style={{ marginTop: spacing.lg, textAlign: 'center' }}>{t('guest.lockedTitle')}</Title>
      <Body muted style={{ marginTop: spacing.sm, textAlign: 'center' }}>{t('guest.farmsLocked')}</Body>
      <Button
        title={t('guest.createAccount')}
        icon="person-add"
        style={{ marginTop: spacing.xl, alignSelf: 'stretch' }}
        onPress={() => navigation.navigate('SettingsAccount')}
      />
    </View>
  );
}
