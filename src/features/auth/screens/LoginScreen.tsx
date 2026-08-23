import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, View } from 'react-native';

import { useAppDispatch } from '@/app/hooks';
import { Body, Button, FormError, Screen, TextField, Title } from '@/shared/components/ui';
import { useToast } from '@/shared/providers/ToastProvider';
import { font, spacing } from '@/shared/theme/theme';

import { useColors } from '@/features/theme';
import type { AuthStackParamList } from '@/navigation/types';
import { continueAsGuestThunk, loginThunk } from '../store/auth.slice';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const colors = useColors();
  const toast = useToast();
  const dispatch = useAppDispatch();
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
      await dispatch(loginThunk({ identifier: identifier.trim(), password })).unwrap();
      toast.success(t('auth.loggedIn')); 
    } catch (e) {
      setError(typeof e === 'string' ? e : (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function onGuest() {
    await dispatch(continueAsGuestThunk());
  }

  return (
    <Screen scroll>
      <View style={{ alignItems: 'center', marginTop: spacing.xxl, marginBottom: spacing.xl }}>
        <Image
          source={require('../../../../assets/images/logo.png')}
          style={{ width: 84, height: 84 }}
          resizeMode="contain"
        />
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
        onPress={onGuest}
        style={{ marginTop: spacing.sm }}
      />

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl }}>
        <Body muted>{t('auth.noAccount')} </Body>
        <Pressable onPress={() => navigation.navigate('Register')}>
          <Body style={{ color: colors.primary, fontSize: font.md, fontWeight: '700' }}>{t('auth.signUp')}</Body>
        </Pressable>
      </View>
    </Screen>
  );
}
