import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Body, Button, FormError, Screen, TextField, Title } from '@/shared/components/ui';
import { apiErrorMessage } from '@/shared/services/api/api';
import { spacing } from '@/shared/theme/theme';

import { authApi } from '@/features/auth/services/auth.service';
import type { AuthStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!email.trim()) {
      setError(t('auth.emailRequired'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.requestPasswordReset(email.trim());
      navigation.navigate('ResetPassword', { email: email.trim() });
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll>
      <Title style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>{t('auth.forgotPassword')}</Title>
      <Body muted style={{ marginBottom: spacing.lg }}>{t('auth.forgotPasswordHint')}</Body>

      <TextField
        label={t('auth.email')}
        value={email}
        onChangeText={(v) => { setEmail(v); if (error) setError(''); }}
        autoCapitalize="none"
        keyboardType="email-address"
        autoCorrect={false}
      />

      <FormError message={error} />

      <Button title={t('auth.sendCode')} onPress={onSubmit} loading={loading} style={{ marginTop: spacing.sm }} />
    </Screen>
  );
}
