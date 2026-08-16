import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Modal, Platform, Pressable, Text, View } from 'react-native';

import { appVersionApi } from '@/api/endpoints';
import { Body, Button } from '@/components/ui';
import { useColors } from '@/context/ThemeContext';
import { font, radius, spacing } from '@/theme/theme';

function storeUrl(): string {
  if (Platform.OS === 'ios') {
    return process.env.EXPO_PUBLIC_IOS_STORE_URL ?? 'https://apps.apple.com/';
  }
  const pkg = Constants.expoConfig?.android?.package ?? 'com.anonymous.agrimatemobileapp';
  return process.env.EXPO_PUBLIC_ANDROID_STORE_URL ?? `market://details?id=${pkg}`;
}

/**
 * Checks the backend on startup for a newer app version. Shows an update prompt;
 * when the latest release is flagged force_update, the modal cannot be dismissed.
 */
export function UpdateGate() {
  const { t } = useTranslation();
  const colors = useColors();
  const [visible, setVisible] = useState(false);
  const [force, setForce] = useState(false);
  const [latest, setLatest] = useState('');

  useEffect(() => {
    if (Platform.OS === 'web') return; // store updates are native-only
    const platform = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
    const version = Constants.expoConfig?.version ?? '1.0.0';
    appVersionApi
      .check(platform, version)
      .then((res) => {
        if (res.updateAvailable) {
          setForce(res.forceUpdate);
          setLatest(res.latestVersion);
          setVisible(true);
        }
      })
      .catch(() => undefined); // never block startup on a failed/offline check
  }, []);

  function openStore() {
    Linking.openURL(storeUrl()).catch(() => undefined);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      // Android back button: ignored while a force update is required.
      onRequestClose={() => {
        if (!force) setVisible(false);
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
            <Pressable onPress={() => setVisible(false)} style={{ paddingVertical: spacing.md, marginTop: spacing.xs }}>
              <Text style={{ textAlign: 'center', color: colors.inkSoft, fontWeight: '700' }}>{t('update.later')}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}
