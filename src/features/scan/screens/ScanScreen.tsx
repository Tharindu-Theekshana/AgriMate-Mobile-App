import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Body, Button, Card, SectionHeader } from '@/shared/components/ui';
import { useToast } from '@/shared/providers/ToastProvider';
import { apiErrorMessage } from '@/shared/services/api/api';
import { font, radius, spacing, type Palette } from '@/shared/theme/theme';

import { useAppSelector } from '@/app/hooks';
import { selectIsAuthenticated } from '@/features/auth/store/auth.selectors';
import { listCrops } from '@/features/crop/services/crop.local';
import type { LocalCrop } from '@/features/crop/types/crop.types';
import { listFarms } from '@/features/farm/services/farm.local';
import type { LocalFarm } from '@/features/farm/types/farm.types';
import { useColors } from '@/features/theme';
import type { MainStackParamList } from '@/navigation/types';
import { cacheScan } from '../services/scan.local';
import { scanApi } from '../services/scan.service';
import { scanResultStore } from '../utils/scanResultStore';

export default function ScanScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const toast = useToast();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [farms, setFarms] = useState<LocalFarm[]>([]);
  const [crops, setCrops] = useState<LocalCrop[]>([]);
  const [farmId, setFarmId] = useState<string | null>(null);
  const [cropId, setCropId] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) return;
      listFarms().then((f) => {
        setFarms(f);
        if (f.length && farmId == null) setFarmId(f[0].id);
      }).catch(() => undefined);
    }, [isAuthenticated, farmId]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated || farmId == null) return;
      listCrops(farmId).then(setCrops).catch(() => setCrops([]));
      setCropId(null);
    }, [isAuthenticated, farmId]),
  );

  async function pick(fromCamera: boolean) {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.error(t('common.error'));
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true, aspect: [1, 1] })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
  }

  async function analyze() {
    if (!imageUri) return;
    setAnalyzing(true);
    try {
      let scan;
      if (isAuthenticated) {
        let latitude: number | undefined;
        let longitude: number | undefined;
        try {
          const perm = await Location.getForegroundPermissionsAsync();
          if (perm.granted) {
            const pos = await Location.getCurrentPositionAsync({});
            latitude = pos.coords.latitude;
            longitude = pos.coords.longitude;
          }
        } catch {
        }
        const farm = farms.find((f) => f.id === farmId);
        const crop = crops.find((c) => c.id === cropId);
        scan = await scanApi.scan({
          imageUri,
          farmId: farm?.serverId ?? undefined,
          cropId: crop?.serverId ?? undefined,
          latitude,
          longitude,
        });
        await cacheScan(scan); 
      } else {
        scan = await scanApi.guestScan(imageUri);
      }
      scanResultStore.set(scan);
      setImageUri(null);
      navigation.navigate('ScanResult');
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setAnalyzing(false);
    }
  }

  if (analyzing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: spacing.xl }}>
        <Ionicons name="leaf" size={56} color={colors.primary} />
        <Text style={{ marginTop: spacing.lg, fontSize: font.lg, fontWeight: '700', color: colors.ink }}>{t('scan.analyzing')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: spacing.md }}>
        <Text style={{ fontSize: font.xxl, fontWeight: '800', color: colors.ink }}>{t('scan.title')}</Text>
        {isAuthenticated && (
          <Pressable
            onPress={() => navigation.navigate('History')}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt }}>
            <Ionicons name="time-outline" size={16} color={colors.primary} />
            <Text style={{ marginLeft: 6, color: colors.primary, fontWeight: '700', fontSize: font.sm }}>{t('history.title')}</Text>
          </Pressable>
        )}
      </View>

      <View
        style={{
          aspectRatio: 1,
          borderRadius: radius.xl,
          backgroundColor: colors.surfaceAlt,
          borderWidth: 2,
          borderColor: colors.border,
          borderStyle: 'dashed',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          marginBottom: spacing.lg,
        }}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <>
            <Ionicons name="image-outline" size={56} color={colors.inkFaint} />
            <Body muted style={{ marginTop: spacing.sm }}>{t('scan.takePhoto')}</Body>
          </>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
        <Button title={t('scan.takePhoto')} icon="camera" onPress={() => pick(true)} style={{ flex: 1 }} />
        <Button title={t('scan.chooseGallery')} icon="images" variant="secondary" onPress={() => pick(false)} style={{ flex: 1 }} />
      </View>

      {isAuthenticated && farms.length > 0 && (
        <>
          <SectionHeader title={t('scan.selectFarm')} />
          <Body muted style={{ fontSize: font.sm, marginTop: -spacing.sm, marginBottom: spacing.sm }}>
            {t('scan.selectFarmHint')}
          </Body>
          <Chips colors={colors} items={farms.map((f) => ({ id: f.id, label: f.name }))} selected={farmId} onSelect={setFarmId} />
          {crops.length > 0 && (
            <>
              <SectionHeader title={t('scan.selectCrop')} />
              <Body muted style={{ fontSize: font.sm, marginTop: -spacing.sm, marginBottom: spacing.sm }}>
                {t('scan.selectCropHint')}
              </Body>
              <Chips
                colors={colors}
                items={crops.map((c) => ({
                  id: c.id,
                  label: `${c.variety || t('crop.title')}${
                    c.growthStage ? ` · ${t(`crop.stages.${c.growthStage}`, { defaultValue: c.growthStage })}` : ''
                  }`,
                }))}
                selected={cropId}
                onSelect={(id) => setCropId(id === cropId ? null : id)}
              />
            </>
          )}
        </>
      )}

      <Card style={{ backgroundColor: colors.pale, borderColor: colors.accent, marginVertical: spacing.lg }}>
        <Text style={{ fontWeight: '700', color: colors.primaryDeep, marginBottom: spacing.xs }}>{t('scan.tipTitle')}</Text>
        {[t('scan.tip1'), t('scan.tip2'), t('scan.tip3')].map((tip) => (
          <View key={tip} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            <Text style={{ marginLeft: spacing.sm, color: colors.ink, fontSize: font.sm }}>{tip}</Text>
          </View>
        ))}
      </Card>

      <Button title={t('scan.title')} icon="scan" onPress={analyze} disabled={!imageUri} />
    </ScrollView>
  );
}

function Chips({
  colors,
  items,
  selected,
  onSelect,
}: {
  colors: Palette;
  items: { id: string; label: string }[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
      {items.map((it) => {
        const active = selected === it.id;
        return (
          <Pressable
            key={it.id}
            onPress={() => onSelect(it.id)}
            style={{
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.lg,
              borderRadius: radius.pill,
              borderWidth: 1.5,
              borderColor: active ? colors.primary : colors.border,
              backgroundColor: active ? colors.pale : colors.surface,
            }}>
            <Text style={{ color: active ? colors.primaryDeep : colors.ink, fontWeight: '600' }}>{it.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
