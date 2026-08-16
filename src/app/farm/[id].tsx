import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, Text, View } from 'react-native';

import { FarmFormModal } from '@/app/(tabs)/farms';
import { CropFormModal } from '@/components/CropFormModal';
import { Body, Button, Card, EmptyState, Loading, Screen, Title } from '@/components/ui';
import { useColors } from '@/context/ThemeContext';
import { listCrops } from '@/data/crops';
import { deleteFarm, getFarm } from '@/data/farms';
import { syncNow } from '@/data/sync';
import type { LocalCrop, LocalFarm } from '@/data/types';
import { useToast } from '@/context/ToastContext';
import { type Palette, font, radius, spacing } from '@/theme/theme';
import { cropProgress } from '@/utils/crop';
import { formatDate } from '@/utils/format';

export default function FarmDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const farmId = String(id);
  const { t } = useTranslation();
  const colors = useColors();
  const toast = useToast();
  const router = useRouter();
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

  function confirmDelete() {
    Alert.alert(t('farm.editFarm'), t('farm.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteFarm(farmId);
            void syncNow(true);
            router.back();
          } catch (e) {
            toast.error((e as Error).message);
          }
        },
      },
    ]);
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
      <Stack.Screen
        options={{
          title: farm.name,
          headerRight: () => (
            <Pressable onPress={() => setEditOpen(true)} hitSlop={10}>
              <Ionicons name="create-outline" size={24} color={colors.primary} />
            </Pressable>
          ),
        }}
      />

      {/* Farm summary */}
      <Card>
        <Text style={{ fontSize: font.xl, fontWeight: '800', color: colors.ink }}>{farm.name}</Text>
        <View style={{ marginTop: spacing.sm, gap: 4 }}>
          <Body muted>{farm.category === 'ANIMAL' ? '🐄' : '🌾'} {farm.category === 'ANIMAL' ? t('farm.categoryAnimal') : t('farm.categoryCrop')}</Body>
          {farm.sizeAcres ? <Body muted>📐 {farm.sizeAcres} {t('farm.size')}</Body> : null}
          {farm.soilType ? <Body muted>🌱 {farm.soilType}</Body> : null}
          {farm.latitude ? <Body muted>📍 {farm.latitude.toFixed(4)}, {farm.longitude?.toFixed(4)}</Body> : null}
        </View>
      </Card>

      {/* Stats */}
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
        <StatTile colors={colors} label={t('farm.activeCrops')} value={String(active.length)} />
        <StatTile colors={colors} label={t('farm.totalArea')} value={`${totalArea || 0}`} />
        <StatTile colors={colors} label={t('farm.nextHarvest')} value={nextHarvest ? formatDate(nextHarvest) : '—'} small />
      </View>

      {/* Crops */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.md }}>
        <Title>{t('farm.crops')}</Title>
        <Button title={t('crop.add')} icon="add" onPress={() => setCropOpen(true)} style={{ minHeight: 44, paddingHorizontal: spacing.md }} />
      </View>

      {crops.length === 0 ? (
        <Card><EmptyState icon="leaf-outline" text={t('farm.noCrops')} /></Card>
      ) : (
        crops.map((c) => <CropCard key={c.id} colors={colors} crop={c} onPress={() => router.push(`/crop/${c.id}`)} />)
      )}

      <Button title={t('common.delete')} variant="danger" icon="trash" style={{ marginTop: spacing.xl }} onPress={confirmDelete} />

      <FarmFormModal visible={editOpen} initial={farm} onClose={() => setEditOpen(false)} onSaved={() => { setEditOpen(false); load(); }} />
      <CropFormModal visible={cropOpen} farmId={farmId} onClose={() => setCropOpen(false)} onSaved={() => { setCropOpen(false); load(); }} />
    </Screen>
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
            {crop.variety || t('farm.paddy')}{crop.season ? ` · ${t(`crop.${crop.season.toLowerCase()}`)}` : ''}
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
