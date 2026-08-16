import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Body, Button, Title } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/context/ThemeContext';
import { spacing } from '@/theme/theme';

/**
 * Mobile equivalent of the admin ProtectedRoute: renders children only when
 * `isAuthenticated === true`. Guests see a friendly prompt to create an account.
 * (Token storage on device is SecureStore — cookies/sessionStorage are web-only.)
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();

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
        onPress={() => router.push('/settings/account')}
      />
    </View>
  );
}
