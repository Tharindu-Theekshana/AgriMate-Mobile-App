import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useLayoutEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { Body, Button, Card, EmptyState, Loading, Screen, Title } from '@/shared/components/ui';
import { useToast } from '@/shared/providers/ToastProvider';
import { syncNow } from '@/shared/services/sync/sync';
import { font, radius, spacing, type Palette } from '@/shared/theme/theme';
import { formatDate, prettifyKey } from '@/shared/utils/format';

import { CropFormModal } from '@/features/crop/components/CropFormModal';
import { listCrops } from '@/features/crop/services/crop.local';
import type { LocalCrop } from '@/features/crop/types/crop.types';
import { cropProgress } from '@/features/crop/utils/crop';
import { useColors } from '@/features/theme';
import type { MainStackParamList } from '@/navigation/types';
import { FarmFormModal } from '../components/FarmFormModal';
import { deleteFarm, getFarm } from '../services/farm.local';
import type { LocalFarm } from '../types/farm.types';

type Props = NativeStackScreenProps<MainStackParamList, 'FarmDetail'>;

export default function FarmDetailScreen({ route, navigation }: Props) {
  const { farmId } = route.params;
  const { t } = useTranslation();
  const colors = useColors();
  const toast = useToast();
  const [farm, setFarm] = useState<LocalFarm | null>(null);
  const [crops, setCrops] = useState<LocalCrop[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);

  const load = useCallback(async () => {
    const [f, c] = await Promise.all([getFarm(farmId), listCrops(farmId)]);
    setFarm(f);
    setCrops(c);
  }, [farmId]);

  useFocusEffect(useCallback(() => { load().catch(() => undefined); }, [load]));

  useLayoutEffect(() => {
    navigation.setOptions({
      title: farm?.name ?? '',
      headerRight: () => (
        <Pressable onPress={() => setEditOpen(true)} hitSlop={10}>
          <Ionicons name="create-outline" size={24} color={colors.primary} />
        </Pressable>
      ),
    });
  }, [navigation, farm?.name, colors.primary]);

  async function confirmDelete() {
    const confirmed = await toast.confirm(t('farm.deleteConfirm'), {
      title: t('farm.delete'),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await deleteFarm(farmId);
      void syncNow(true);
      navigation.goBack();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  if (!farm) return <Loading />;

  const active = crops.filter((c) => c.status === 'GROWING');
  const totalArea = crops.reduce((sum, c) => sum + (c.areaAcres ?? 0), 0);
  const nextHarvest = active
    .map((c) => c.expectedHarvestDate)
    .filter(Boolean)
    .sort()[0] as string | undefined;

  return (
    <Screen scroll>
      <Card>
        <Text style={{ fontSize: font.xl, fontWeight: '800', color: colors.ink }}>{farm.name}</Text>
        <View style={{ marginTop: spacing.sm, gap: 6 }}>
          {farm.sizeAcres ? (
            <MetaRow colors={colors} icon="resize-outline">{farm.sizeAcres} {t('farm.size')}</MetaRow>
          ) : null}
          {farm.soilType ? (
            <MetaRow colors={colors} icon="layers-outline">{farm.soilType}</MetaRow>
          ) : null}
          {farm.latitude ? (
            <MetaRow colors={colors} icon="location-outline">{farm.latitude.toFixed(4)}, {farm.longitude?.toFixed(4)}</MetaRow>
          ) : null}
        </View>
      </Card>

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
        <StatTile colors={colors} label={t('farm.activeCrops')} value={String(active.length)} />
        <StatTile colors={colors} label={t('farm.totalArea')} value={`${totalArea || 0}`} />
        <StatTile colors={colors} label={t('farm.nextHarvest')} value={nextHarvest ? formatDate(nextHarvest) : '-'} small />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.md }}>
        <Title>{t('farm.crops')}</Title>
        <Button title={t('crop.add')} icon="add" onPress={() => setCropOpen(true)} style={{ minHeight: 44, paddingHorizontal: spacing.md }} />
      </View>

      {crops.length === 0 ? (
        <Card><EmptyState icon="leaf-outline" text={t('farm.noCrops')} /></Card>
      ) : (
        crops.map((c) => (
          <CropCard key={c.id} colors={colors} crop={c} onPress={() => navigation.navigate('CropDetail', { cropId: c.id })} />
        ))
      )}

      <Button title={t('common.delete')} variant="danger" icon="trash" style={{ marginTop: spacing.xl }} onPress={confirmDelete} />

      <FarmFormModal visible={editOpen} initial={farm} onClose={() => setEditOpen(false)} onSaved={() => { setEditOpen(false); load(); }} />
      <CropFormModal visible={cropOpen} farmId={farmId} onClose={() => setCropOpen(false)} onSaved={() => { setCropOpen(false); load(); }} />
    </Screen>
  );
}

function MetaRow({
  colors,
  icon,
  children,
}: {
  colors: Palette;
  icon: keyof typeof Ionicons.glyphMap;
  children: ReactNode;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Ionicons name={icon} size={14} color={colors.inkSoft} />
      <Body muted>{children}</Body>
    </View>
  );
}

function StatTile({ colors, label, value, small }: { colors: Palette; label: string; value: string; small?: boolean }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md }}>
      <Text style={{ fontSize: small ? font.sm : font.xl, fontWeight: '800', color: colors.ink }}>{value}</Text>
      <Text style={{ fontSize: font.xs, color: colors.inkSoft, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function CropCard({
  colors,
  crop,
  onPress,
}: {
  colors: Palette;
  crop: LocalCrop;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const progress = cropProgress(crop);
  const statusColor = crop.status === 'HARVESTED' ? colors.info : crop.status === 'FAILED' ? colors.danger : colors.primary;
  return (
    <Card onPress={onPress} style={{ marginBottom: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, paddingRight: spacing.sm }}>
          <Text style={{ fontWeight: '700', color: colors.ink, fontSize: font.md }}>
            {crop.variety || prettifyKey(crop.cropType)}{crop.season ? ` · ${t(`crop.${crop.season.toLowerCase()}`)}` : ''}
          </Text>
          <Body muted style={{ fontSize: font.sm }}>
            {crop.plantingDate ? t('crop.dayN', { n: progress.daysSincePlanting ?? 0 }) : t('crop.notPlanted')}
            {crop.areaAcres ? ` · ${crop.areaAcres} ${t('crop.acres')}` : ''}
          </Body>
          {crop.plantingDate && crop.status === 'GROWING' && (
            <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt, overflow: 'hidden', marginTop: 6 }}>
              <View style={{ width: `${Math.round(progress.percent * 100)}%`, height: '100%', backgroundColor: colors.primary }} />
            </View>
          )}
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: `${statusColor}1A` }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: statusColor }} />
            <Text style={{ color: statusColor, fontWeight: '700', fontSize: font.xs }}>{t(`crop.status_${crop.status}`)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
        </View>
      </View>
    </Card>
  );
}
