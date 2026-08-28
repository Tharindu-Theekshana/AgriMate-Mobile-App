import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text } from 'react-native';

import { useAppDispatch } from '@/app/hooks';
import { OtpInput } from '@/shared/components/OtpInput';
import { Body, Button, FormError, Screen, TextField, Title } from '@/shared/components/ui';
import { useToast } from '@/shared/providers/ToastProvider';
import { font, spacing } from '@/shared/theme/theme';

import { authApi } from '@/features/auth/services/auth.service';
import { confirmPasswordResetThunk } from '@/features/auth/store/auth.slice';
import { useColors } from '@/features/theme';
import type { AuthStackParamList } from '@/navigation/types';

const RESEND_COOLDOWN_SECONDS = 15;

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export default function ResetPasswordScreen({ route }: Props) {
  const { email } = route.params;
  const { t } = useTranslation();
  const colors = useColors();
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    const id = setInterval(() => setCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  async function onSubmit() {
    if (!code.trim() || newPassword.length < 6) {
      setError(t('auth.resetValidation'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await dispatch(confirmPasswordResetThunk({ email, code: code.trim(), newPassword })).unwrap();
      toast.success(t('auth.passwordReset'));
    } catch (e) {
      setError(typeof e === 'string' ? e : (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setResending(true);
    try {
      await authApi.requestPasswordReset(email);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success(t('auth.codeResent'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setResending(false);
    }
  }

  return (
    <Screen scroll>
      <Title style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>{t('auth.resetPassword')}</Title>
      <Body muted style={{ marginBottom: spacing.lg }}>{t('auth.resetPasswordHint', { email })}</Body>

      <Text style={{ fontSize: font.sm, fontWeight: '600', color: colors.inkSoft, marginBottom: spacing.sm }}>
        {t('auth.verificationCode')}
      </Text>
      <OtpInput value={code} onChangeText={(v) => { setCode(v); if (error) setError(''); }} />

      <TextField
        label={t('auth.newPassword')}
        value={newPassword}
        onChangeText={(v) => { setNewPassword(v); if (error) setError(''); }}
        secureTextEntry
        placeholder="••••••••"
      />

      <FormError message={error} />

      <Button title={t('auth.resetPassword')} onPress={onSubmit} loading={loading} style={{ marginTop: spacing.sm }} />

      <Pressable onPress={resend} disabled={resending || cooldown > 0} style={{ alignItems: 'center', marginTop: spacing.lg }}>
        <Body style={{ color: cooldown > 0 ? colors.inkFaint : colors.primary, fontWeight: '700' }}>
          {resending ? t('common.loading') : cooldown > 0 ? `${t('auth.resendCode')} (${cooldown}s)` : t('auth.resendCode')}
        </Body>
      </Pressable>
    </Screen>
  );
}
