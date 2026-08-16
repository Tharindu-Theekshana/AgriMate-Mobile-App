import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { apiErrorMessage } from '@/api/client';
import { userApi } from '@/api/endpoints';
import { Body, Button, Card, Screen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { font, radius, spacing } from '@/theme/theme';
import { resolveImageUrl } from '@/utils/format';

export default function AccountScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const toast = useToast();
  const { user, isAuthenticated, logout, setUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [locating, setLocating] = useState(false);

  async function changePhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return toast.error(t('common.error'));
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    if (res.canceled || !res.assets[0]) return;
    setUploading(true);
    try {
      setUser(await userApi.uploadPhoto(res.assets[0].uri));
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
        toast.error(t('common.error'));
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const places = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      const p = places[0];
      const label = [p?.city ?? p?.subregion, p?.region].filter(Boolean).join(', ') || `${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`;
      setUser(await userApi.update({ location: label }));
      toast.success(t('account.locationUpdated'));
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setLocating(false);
    }
  }

  // Guest view
  if (!isAuthenticated) {
    return (
      <Screen scroll>
        <Stack.Screen options={{ title: t('account.title') }} />
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
      <Stack.Screen options={{ title: t('account.title') }} />

      {/* Avatar */}
      <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
        <Pressable onPress={changePhoto} style={{ alignItems: 'center' }}>
          <View style={{ width: 104, height: 104, borderRadius: 52, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {user?.profilePhotoUrl ? (
              <Image source={{ uri: resolveImageUrl(user.profilePhotoUrl) }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            ) : (
              <Ionicons name="person" size={52} color={colors.primary} />
            )}
            <View style={{ position: 'absolute', right: 0, bottom: 0, backgroundColor: colors.primary, borderRadius: 16, padding: 6, borderWidth: 2, borderColor: colors.background }}>
              <Ionicons name="camera" size={16} color={colors.white} />
            </View>
          </View>
          <Text style={{ color: colors.primary, fontWeight: '700', marginTop: spacing.sm }}>
            {uploading ? t('common.loading') : t('account.changePhoto')}
          </Text>
        </Pressable>
      </View>

      {/* Identity */}
      <Card style={{ marginBottom: spacing.lg }}>
        <Text style={{ fontSize: font.lg, fontWeight: '800', color: colors.ink }}>{user?.name}</Text>
        <Body muted style={{ fontSize: font.sm }}>@{user?.username}</Body>
        <Body muted style={{ fontSize: font.sm }}>{user?.email}</Body>
        {user?.phone ? <Body muted style={{ fontSize: font.sm }}>{user.phone}</Body> : null}
      </Card>

      {/* Location (auto) */}
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

      <Button title={t('auth.logout')} variant="danger" icon="log-out" onPress={logout} />
    </Screen>
  );
}
