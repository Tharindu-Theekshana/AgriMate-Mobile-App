import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { OtpInput } from '@/shared/components/OtpInput';
import { Body, Button, Card, FormError, Screen, TextField } from '@/shared/components/ui';
import { useToast } from '@/shared/providers/ToastProvider';
import { apiErrorMessage } from '@/shared/services/api/api';
import { font, radius, spacing } from '@/shared/theme/theme';
import { resolveImageUrl } from '@/shared/utils/format';

import { authApi, userApi } from '@/features/auth/services/auth.service';
import { selectIsAuthenticated, selectUser } from '@/features/auth/store/auth.selectors';
import { confirmPasswordResetThunk, logoutThunk, setUser } from '@/features/auth/store/auth.slice';
import { useColors } from '@/features/theme';

const RESEND_COOLDOWN_SECONDS = 15;

export default function AccountScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const toast = useToast();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [uploading, setUploading] = useState(false);
  const [locating, setLocating] = useState(false);

  const [changingPassword, setChangingPassword] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [cpCode, setCpCode] = useState('');
  const [cpNewPassword, setCpNewPassword] = useState('');
  const [cpError, setCpError] = useState('');
  const [cpLoading, setCpLoading] = useState(false);
  const [cpResending, setCpResending] = useState(false);
  const [cpCooldown, setCpCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (!changingPassword) return;
    setCpCooldown(RESEND_COOLDOWN_SECONDS);
    const id = setInterval(() => setCpCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [changingPassword]);

  function logout() {
    void dispatch(logoutThunk());
  }

  async function changePhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return toast.error(t('common.error'));
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    if (res.canceled || !res.assets[0]) return;
    setUploading(true);
    try {
      dispatch(setUser(await userApi.uploadPhoto(res.assets[0].uri)));
      toast.success(t('account.photoUpdated'));
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setUploading(false);
    }
  }

  async function detectLocation() {
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        toast.error('Location permission denied');
        return;
      }
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        toast.error('Please turn on location services on your device');
        return;
      }
      let pos = await Location.getLastKnownPositionAsync();
      console.log('last known position', pos);
      if (!pos) {
        pos = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Location request timed out')), 15000)),
        ]);
        console.log('fresh position', pos);
      }
      console.log('coords', pos.coords.latitude, pos.coords.longitude);
      const places = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      console.log('reverse geocode', places);
      const p = places[0];
      const label = [p?.city ?? p?.subregion, p?.region].filter(Boolean).join(', ') || `${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`;
      dispatch(setUser(await userApi.update({ location: label })));
      toast.success(t('account.locationUpdated'));
    } catch (e) {
      console.log('location error', e);
      toast.error(e instanceof Error ? e.message : apiErrorMessage(e));
    } finally {
      setLocating(false);
    }
  }

  async function openChangePassword() {
    if (!user?.email) return;
    setSendingCode(true);
    try {
      await authApi.requestPasswordReset(user.email);
      setChangingPassword(true);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setSendingCode(false);
    }
  }

  function cancelChangePassword() {
    setChangingPassword(false);
    setCpCode('');
    setCpNewPassword('');
    setCpError('');
  }

  async function resendChangePasswordCode() {
    if (!user?.email) return;
    setCpResending(true);
    try {
      await authApi.requestPasswordReset(user.email);
      setCpCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success(t('auth.codeResent'));
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setCpResending(false);
    }
  }

  async function confirmChangePassword() {
    if (!user?.email) return;
    if (!cpCode.trim() || cpNewPassword.length < 6) {
      setCpError(t('auth.resetValidation'));
      return;
    }
    setCpError('');
    setCpLoading(true);
    try {
      await dispatch(
        confirmPasswordResetThunk({ email: user.email, code: cpCode.trim(), newPassword: cpNewPassword }),
      ).unwrap();
      toast.success(t('account.passwordChanged'));
      cancelChangePassword();
    } catch (e) {
      setCpError(typeof e === 'string' ? e : (e as Error).message);
    } finally {
      setCpLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <Screen scroll>
        <Card style={{ alignItems: 'center' }}>
          <Ionicons name="person-circle-outline" size={64} color={colors.inkFaint} />
          <Text style={{ fontSize: font.lg, fontWeight: '800', color: colors.ink, marginTop: spacing.sm, textAlign: 'center' }}>
            {t('account.guestTitle')}
          </Text>
          <Body muted style={{ textAlign: 'center', marginTop: spacing.xs }}>{t('account.guestBody')}</Body>
          <Button title={t('guest.createAccount')} icon="person-add" style={{ marginTop: spacing.lg, alignSelf: 'stretch' }} onPress={logout} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
        <Pressable onPress={changePhoto} style={{ alignItems: 'center' }}>
          <View style={{ width: 104, height: 104 }}>
            <View style={{ width: 104, height: 104, borderRadius: 52, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {user?.profilePhotoUrl ? (
                <Image source={{ uri: resolveImageUrl(user.profilePhotoUrl) }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              ) : (
                <Ionicons name="person" size={52} color={colors.primary} />
              )}
            </View>
            <View style={{ position: 'absolute', right: 0, bottom: 0, backgroundColor: colors.primary, borderRadius: 16, padding: 6, borderWidth: 2, borderColor: colors.background }}>
              <Ionicons name="camera" size={16} color={colors.white} />
            </View>
          </View>
          <Text style={{ color: colors.primary, fontWeight: '700', marginTop: spacing.sm }}>
            {uploading ? t('common.loading') : t('account.changePhoto')}
          </Text>
        </Pressable>
      </View>

      <Card style={{ marginBottom: spacing.lg }}>
        <Text style={{ fontSize: font.lg, fontWeight: '800', color: colors.ink }}>{user?.name}</Text>
        <Body muted style={{ fontSize: font.sm }}>@{user?.username}</Body>
        <Body muted style={{ fontSize: font.sm }}>{user?.email}</Body>
        {user?.phone ? <Body muted style={{ fontSize: font.sm }}>{user.phone}</Body> : null}
      </Card>

      <Text style={{ fontSize: font.sm, fontWeight: '700', color: colors.inkSoft, marginBottom: spacing.sm }}>{t('account.location')}</Text>
      <Card style={{ marginBottom: spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
          <Ionicons name="location" size={20} color={colors.primary} />
          <Text style={{ flex: 1, marginLeft: spacing.sm, color: colors.ink, fontWeight: '600' }}>
            {user?.location ?? t('account.locationAuto')}
          </Text>
        </View>
        <Button
          title={locating ? t('account.locating') : t('account.locationUpdate')}
          icon="navigate"
          variant="secondary"
          loading={locating}
          onPress={detectLocation}
          style={{ borderRadius: radius.md }}
        />
      </Card>

      {!changingPassword ? (
        <Button
          title={t('account.changePassword')}
          icon="lock-closed"
          variant="secondary"
          loading={sendingCode}
          onPress={openChangePassword}
          style={{ marginBottom: spacing.lg, borderRadius: radius.md }}
        />
      ) : (
        <Card style={{ marginBottom: spacing.lg }}>
          <Text style={{ fontSize: font.md, fontWeight: '700', color: colors.ink, marginBottom: spacing.xs }}>
            {t('account.changePassword')}
          </Text>
          <Body muted style={{ fontSize: font.sm, marginBottom: spacing.lg }}>
            {t('account.changePasswordHint', { email: user?.email })}
          </Body>

          <Text style={{ fontSize: font.sm, fontWeight: '600', color: colors.inkSoft, marginBottom: spacing.sm }}>
            {t('auth.verificationCode')}
          </Text>
          <OtpInput value={cpCode} onChangeText={(v) => { setCpCode(v); if (cpError) setCpError(''); }} />

          <TextField
            label={t('auth.newPassword')}
            value={cpNewPassword}
            onChangeText={(v) => { setCpNewPassword(v); if (cpError) setCpError(''); }}
            secureTextEntry
            placeholder="••••••••"
          />

          <FormError message={cpError} />

          <Button title={t('common.confirm')} loading={cpLoading} onPress={confirmChangePassword} style={{ borderRadius: radius.md }} />

          <Pressable
            onPress={resendChangePasswordCode}
            disabled={cpResending || cpCooldown > 0}
            style={{ alignItems: 'center', marginTop: spacing.lg }}>
            <Body style={{ color: cpCooldown > 0 ? colors.inkFaint : colors.primary, fontWeight: '700' }}>
              {cpResending ? t('common.loading') : cpCooldown > 0 ? `${t('auth.resendCode')} (${cpCooldown}s)` : t('auth.resendCode')}
            </Body>
          </Pressable>

          <Pressable onPress={cancelChangePassword} style={{ alignItems: 'center', marginTop: spacing.md }}>
            <Body muted style={{ fontWeight: '600' }}>{t('common.cancel')}</Body>
          </Pressable>
        </Card>
      )}

      <Button title={t('auth.logout')} variant="danger" icon="log-out" onPress={logout} />
    </Screen>
  );
}
