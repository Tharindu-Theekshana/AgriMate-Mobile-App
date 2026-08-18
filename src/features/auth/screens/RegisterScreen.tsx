import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Switch, Text, View } from 'react-native';

import { useAppDispatch } from '@/app/hooks';
import { Body, Button, Card, FormError, Screen, TextField, Title } from '@/shared/components/ui';
import { LANGUAGES, setLanguage, type LanguageCode } from '@/shared/i18n';
import { useToast } from '@/shared/providers/ToastProvider';
import { font, radius, spacing } from '@/shared/theme/theme';

import { useColors } from '@/features/theme';
import type { AuthStackParamList } from '@/navigation/types';
import { registerThunk } from '../store/auth.slice';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen(_props: Props) {
  const { t } = useTranslation();
  const colors = useColors();
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [lang, setLang] = useState<LanguageCode>('en');
  const [isAgronomist, setIsAgronomist] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function pickLang(code: LanguageCode) {
    setLang(code);
    await setLanguage(code); 
  }

  async function onSubmit() {
    if (!username || !email || !name || password.length < 6) {
      setError(t('auth.registerValidation'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await dispatch(
        registerThunk({
          username: username.trim(),
          email: email.trim(),
          name: name.trim(),
          phone: phone.trim() || undefined,
          password,
          location: location.trim() || undefined,
          role: isAgronomist ? 'AGRONOMIST' : 'FARMER',
        }),
      ).unwrap();
      toast.success(t('auth.registered')); 
    } catch (e) {
      setError(typeof e === 'string' ? e : (e as Error).message); 
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll>
      <Title style={{ marginTop: spacing.lg, marginBottom: spacing.lg }}>{t('auth.register')}</Title>

      <Text style={{ fontSize: font.sm, fontWeight: '600', color: colors.inkSoft, marginBottom: spacing.xs }}>
        {t('auth.chooseLanguage')}
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
        {LANGUAGES.map((l) => {
          const active = lang === l.code;
          return (
            <Pressable
              key={l.code}
              onPress={() => pickLang(l.code)}
              style={{
                flex: 1,
                paddingVertical: spacing.md,
                borderRadius: radius.md,
                borderWidth: 1.5,
                borderColor: active ? colors.primary : colors.border,
                backgroundColor: active ? colors.pale : colors.surface,
                alignItems: 'center',
              }}>
              <Text style={{ fontWeight: '700', color: active ? colors.primaryDeep : colors.ink }}>{l.native}</Text>
            </Pressable>
          );
        })}
      </View>

      <TextField label={t('auth.username')} value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} />
      <TextField label={t('auth.email')} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoCorrect={false} />
      <TextField label={t('auth.name')} value={name} onChangeText={setName} />
      <TextField label={`${t('auth.phone')} (${t('common.optional')})`} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextField label={t('auth.password')} value={password} onChangeText={setPassword} secureTextEntry />
      <TextField label={`${t('auth.location')} (${t('common.optional')})`} value={location} onChangeText={setLocation} />

      <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg }}>
        <View style={{ flex: 1, paddingRight: spacing.md }}>
          <Text style={{ fontWeight: '700', color: colors.ink, fontSize: font.md }}>{t('auth.registerAsAgronomist')}</Text>
          <Body muted style={{ fontSize: font.sm, marginTop: 2 }}>{t('auth.agronomistNote')}</Body>
        </View>
        <Switch value={isAgronomist} onValueChange={setIsAgronomist} trackColor={{ true: colors.accent }} />
      </Card>

      <FormError message={error} />

      <Button title={t('auth.signUp')} onPress={onSubmit} loading={loading} />
    </Screen>
  );
}
