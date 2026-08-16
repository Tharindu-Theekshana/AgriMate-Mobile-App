import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Body, Button, FormError, Screen, TextField, Title } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { font, spacing } from '@/theme/theme';

export default function LoginScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const toast = useToast();
  const { login, continueAsGuest } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!identifier || !password) {
      setError(t('auth.fillFields'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(identifier.trim(), password);
      toast.success(t('auth.loggedIn')); // AuthGate navigates automatically
    } catch (e) {
      setError((e as Error).message); // inline, on-screen
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll>
      <View style={{ alignItems: 'center', marginTop: spacing.xxl, marginBottom: spacing.xl }}>
        <View
          style={{
            width: 84,
            height: 84,
            borderRadius: 24,
            backgroundColor: colors.pale,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Ionicons name="leaf" size={44} color={colors.primary} />
        </View>
        <Title style={{ marginTop: spacing.lg }}>{t('auth.welcome')}</Title>
        <Body muted style={{ marginTop: spacing.xs }}>{t('auth.subtitle')}</Body>
      </View>

      <TextField
        label={t('auth.usernameOrEmail')}
        value={identifier}
        onChangeText={(v) => { setIdentifier(v); if (error) setError(''); }}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="sunil  /  sunil@example.com"
      />
      <TextField
        label={t('auth.password')}
        value={password}
        onChangeText={(v) => { setPassword(v); if (error) setError(''); }}
        secureTextEntry
        placeholder="••••••••"
      />

      <FormError message={error} />

      <Button title={t('auth.signIn')} onPress={onSubmit} loading={loading} style={{ marginTop: spacing.sm }} />

      <Button
        title={t('auth.continueAsGuest')}
        variant="ghost"
        icon="person-outline"
        onPress={continueAsGuest}
        style={{ marginTop: spacing.sm }}
      />

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl }}>
        <Body muted>{t('auth.noAccount')} </Body>
        <Link href="/register" style={{ color: colors.primary, fontSize: font.md, fontWeight: '700' }}>
          {t('auth.signUp')}
        </Link>
      </View>
    </Screen>
  );
}
