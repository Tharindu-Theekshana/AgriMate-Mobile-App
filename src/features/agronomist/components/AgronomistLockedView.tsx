import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useAppDispatch } from '@/app/hooks';
import { Body, Button, Screen, Title } from '@/shared/components/ui';
import { useToast } from '@/shared/providers/ToastProvider';
import { apiErrorMessage } from '@/shared/services/api/api';
import { radius, spacing } from '@/shared/theme/theme';
import { resolveImageUrl } from '@/shared/utils/format';
import type { AgronomistStatus } from '@/shared/types/api.types';

import { setUser } from '@/features/auth/store/auth.slice';
import { useColors } from '@/features/theme';
import { agronomistApi } from '../services/agronomist.service';

export function AgronomistLockedView({
  status,
  proofUrl,
}: {
  status: AgronomistStatus;
  proofUrl?: string | null;
}) {
  const { t } = useTranslation();
  const colors = useColors();
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [uploading, setUploading] = useState(false);

  const rejected = status === 'REJECTED';
  const icon = rejected ? 'close-circle' : 'time-outline';
  const iconColor = rejected ? colors.danger : colors.warning;
  const title = rejected ? t('agronomist.lockedTitleRejected') : t('agronomist.lockedTitle');
  const body = rejected ? t('agronomist.lockedBodyRejected') : t('agronomist.lockedBodyPending');

  async function pickAndUpload() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.error(t('common.error'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true, aspect: [4, 3] });
    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      const updated = await agronomistApi.uploadProof(result.assets[0].uri);
      dispatch(setUser(updated));
      toast.success(t('agronomist.proofUploaded'));
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setUploading(false);
    }
  }

  return (
    <Screen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: colors.pale,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.lg,
          }}>
          <Ionicons name={icon} size={40} color={iconColor} />
        </View>
        <Title style={{ textAlign: 'center', marginBottom: spacing.sm }}>{title}</Title>
        <Body muted style={{ textAlign: 'center', marginBottom: spacing.xl }}>
          {body}
        </Body>

        {proofUrl ? (
          <Image
            source={{ uri: resolveImageUrl(proofUrl) }}
            style={{ width: 180, height: 135, borderRadius: radius.md, marginBottom: spacing.lg }}
            contentFit="cover"
          />
        ) : null}

        <Button
          title={proofUrl ? t('agronomist.changeProof') : t('agronomist.addProof')}
          variant="secondary"
          icon="camera"
          loading={uploading}
          onPress={pickAndUpload}
        />
      </View>
    </Screen>
  );
}
