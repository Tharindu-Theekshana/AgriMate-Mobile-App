import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Modal, Platform, Pressable, Text, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Body, Button } from '@/shared/components/ui';
import { font, radius, spacing } from '@/shared/theme/theme';

import { useColors } from '@/features/theme';
import {
  selectAppVersionChecked,
  selectForceUpdate,
  selectLatestVersion,
  selectUpdateAvailable,
} from '../store/appVersion.selectors';
import { checkAppVersionThunk } from '../store/appVersion.slice';

function storeUrl(): string {
  if (Platform.OS === 'ios') {
    return process.env.EXPO_PUBLIC_IOS_STORE_URL ?? 'https://apps.apple.com/';
  }
  const pkg = Constants.expoConfig?.android?.package ?? 'com.anonymous.agrimatemobileapp';
  return process.env.EXPO_PUBLIC_ANDROID_STORE_URL ?? `market://details?id=${pkg}`;
}

export function UpdateGate() {
  const { t } = useTranslation();
  const colors = useColors();
  const dispatch = useAppDispatch();
  const checked = useAppSelector(selectAppVersionChecked);
  const updateAvailable = useAppSelector(selectUpdateAvailable);
  const force = useAppSelector(selectForceUpdate);
  const latest = useAppSelector(selectLatestVersion);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!checked) void dispatch(checkAppVersionThunk());
  }, [checked, dispatch]);

  const visible = checked && updateAvailable && !dismissed;

  function openStore() {
    Linking.openURL(storeUrl()).catch(() => undefined);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!force) setDismissed(true);
      }}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <View style={{ width: '100%', maxWidth: 380, backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl }}>
          <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
            <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="cloud-download" size={34} color={colors.primary} />
            </View>
          </View>
          <Text style={{ fontSize: font.xl, fontWeight: '800', color: colors.ink, textAlign: 'center' }}>
            {t('update.title')}
          </Text>
          <Body muted style={{ textAlign: 'center', marginTop: spacing.sm }}>
            {force ? t('update.forceMessage') : t('update.message')}
          </Body>
          {latest ? (
            <Text style={{ textAlign: 'center', color: colors.inkFaint, fontSize: font.sm, marginTop: spacing.sm }}>
              {t('update.latest', { version: latest })}
            </Text>
          ) : null}

          <Button title={t('update.updateNow')} icon="download" onPress={openStore} style={{ marginTop: spacing.lg }} />

          {!force && (
            <Pressable onPress={() => setDismissed(true)} style={{ paddingVertical: spacing.md, marginTop: spacing.xs }}>
              <Text style={{ textAlign: 'center', color: colors.inkSoft, fontWeight: '700' }}>{t('update.later')}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}
