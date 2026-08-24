import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { Body, Button, Card, EmptyState, Loading, Screen, Title } from '@/shared/components/ui';
import { useToast } from '@/shared/providers/ToastProvider';
import { syncNow } from '@/shared/services/sync/sync';
import { font, radius, spacing, type Palette } from '@/shared/theme/theme';
import { formatDate } from '@/shared/utils/format';

import { useColors } from '@/features/theme';
import { TreatmentModal } from '@/features/treatment/components/TreatmentModal';
import { deleteTreatment, listTreatments } from '@/features/treatment/services/treatment.local';
import type { LocalTreatment } from '@/features/treatment/types/treatment.types';
import type { MainStackParamList } from '@/navigation/types';
import { CropFormModal } from '../components/CropFormModal';
import { HarvestModal } from '../components/HarvestModal';
import { StageLogModal } from '../components/StageLogModal';
import { deleteCrop, getCrop } from '../services/crop.local';
import { deleteStageLog, listStageLogs } from '../services/stageLog.local';
import type { LocalCrop } from '../types/crop.types';
import type { LocalStageLog } from '../types/stageLog.types';
import { PADDY_STAGES, cropProgress, resolveStageIndex, type StageKey } from '../utils/crop';

const STATUS_COLOR = (c: Palette, s: string) =>
  s === 'HARVESTED' ? c.info : s === 'FAILED' ? c.danger : c.primary;

type Props = NativeStackScreenProps<MainStackParamList, 'CropDetail'>;

export default function CropDetailScreen({ route, navigation }: Props) {
  const { cropId } = route.params;
  const { t } = useTranslation();
  const colors = useColors();
  const toast = useToast();
  const [crop, setCrop] = useState<LocalCrop | null>(null);
  const [logs, setLogs] = useState<LocalTreatment[]>([]);
  const [stageLogs, setStageLogs] = useState<LocalStageLog[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [harvestOpen, setHarvestOpen] = useState(false);
  const [treatOpen, setTreatOpen] = useState(false);
  const [stageLogOpen, setStageLogOpen] = useState(false);

  const load = useCallback(async () => {
    const [c, l, sl] = await Promise.all([getCrop(cropId), listTreatments(cropId), listStageLogs(cropId)]);
    setCrop(c);
    setLogs(l);
    setStageLogs(sl);
  }, [cropId]);

  useFocusEffect(useCallback(() => { load().catch(() => undefined); }, [load]));

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('crop.title'),
      headerRight: () => (
        <Pressable onPress={() => setEditOpen(true)} hitSlop={10}>
          <Ionicons name="create-outline" size={24} color={colors.primary} />
        </Pressable>
      ),
    });
  }, [navigation, t, colors.primary]);

  if (!crop) return <Loading />;

  const progress = cropProgress(crop);
  const stageIndex = resolveStageIndex(crop, progress);
  const statusColor = STATUS_COLOR(colors, crop.status);
  const title = crop.variety || t('crop.title');

  async function confirmDelete() {
    const confirmed = await toast.confirm(t('crop.deleteConfirm'), {
      title: t('crop.delete'),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      destructive: true,
    });
    if (!confirmed) return;
    await deleteCrop(cropId);
    void syncNow(true);
    toast.success(t('crop.deleted'));
    navigation.goBack();
  }

  async function removeLog(logId: string) {
    await deleteTreatment(logId);
    void syncNow(true);
    load();
  }

  async function removeStageLog(id: string) {
    await deleteStageLog(id);
    void syncNow(true);
    load();
  }

  const yieldPerAcre = crop.yieldKg && crop.areaAcres ? Math.round(crop.yieldKg / crop.areaAcres) : null;
  const stageDateByKey = stageLogs.reduce<Partial<Record<StageKey, string>>>((acc, log) => {
    if (!acc[log.stageKey]) acc[log.stageKey] = log.reachedDate;
    return acc;
  }, {});

  return (
    <Screen scroll>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: font.xl, fontWeight: '800', color: colors.ink }}>{title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: `${statusColor}1A` }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: statusColor }} />
            <Text style={{ color: statusColor, fontWeight: '700', fontSize: font.sm }}>{t(`crop.status_${crop.status}`)}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm }}>
          {crop.season ? <Meta colors={colors} icon="calendar" text={t(`crop.${crop.season.toLowerCase()}`)} /> : null}
          {crop.areaAcres ? <Meta colors={colors} icon="resize" text={`${crop.areaAcres} ${t('crop.acres')}`} /> : null}
          {crop.plantingDate ? <Meta colors={colors} icon="leaf" text={formatDate(crop.plantingDate)} /> : null}
        </View>
      </Card>

      {crop.plantingDate && (
        <Card style={{ marginTop: spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
            <Text style={{ fontWeight: '800', color: colors.ink, fontSize: font.md }}>{t('crop.lifecycle')}</Text>
            <Pressable onPress={() => setStageLogOpen(true)} hitSlop={10} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: font.sm }}>{t('crop.logStage')}</Text>
            </Pressable>
          </View>

          <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}>
            <View style={{ width: `${Math.round(progress.percent * 100)}%`, height: '100%', backgroundColor: colors.primary }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs }}>
            <Body muted style={{ fontSize: font.sm }}>{t('crop.dayN', { n: progress.daysSincePlanting ?? 0 })}</Body>
            {progress.daysToHarvest != null && (
              <Body muted style={{ fontSize: font.sm, color: progress.daysToHarvest < 0 ? colors.warning : colors.inkSoft }}>
                {progress.daysToHarvest >= 0 ? t('crop.daysToHarvest', { n: progress.daysToHarvest }) : t('crop.overdue', { n: -progress.daysToHarvest })}
              </Body>
            )}
          </View>

          <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
            {PADDY_STAGES.map((s, i) => {
              const done = i < stageIndex;
              const current = i === stageIndex && crop.status !== 'HARVESTED';
              const color = done || current ? colors.primary : colors.inkFaint;
              const reachedDate = stageDateByKey[s.key];
              return (
                <View key={s.key} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name={done ? 'checkmark-circle' : current ? 'ellipse' : 'ellipse-outline'} size={18} color={color} />
                    <Text style={{ marginLeft: spacing.sm, color: current ? colors.ink : colors.inkSoft, fontWeight: current ? '800' : '500' }}>
                      {t(`crop.stages.${s.key}`)}
                    </Text>
                  </View>
                  {reachedDate ? (
                    <Body muted style={{ fontSize: font.xs }}>{formatDate(reachedDate)}</Body>
                  ) : null}
                </View>
              );
            })}
          </View>
        </Card>
      )}

      {stageLogs.length > 0 && (
        <Card style={{ marginTop: spacing.md }}>
          <Text style={{ fontWeight: '800', color: colors.ink, fontSize: font.md, marginBottom: spacing.sm }}>{t('crop.stageHistory')}</Text>
          {stageLogs.map((log) => (
            <View key={log.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 }}>
              <Text style={{ color: colors.ink, fontWeight: '600' }}>{t(`crop.stages.${log.stageKey}`)}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Body muted style={{ fontSize: font.sm }}>{formatDate(log.reachedDate)}</Body>
                <Pressable hitSlop={10} onPress={() => removeStageLog(log.id)}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              </View>
            </View>
          ))}
        </Card>
      )}

      {crop.status === 'HARVESTED' ? (
        <Card style={{ marginTop: spacing.md, backgroundColor: colors.pale, borderColor: colors.accent }}>
          <Text style={{ fontWeight: '800', color: colors.primaryDeep, marginBottom: spacing.sm }}>{t('crop.harvestRecord')}</Text>
          <Stat colors={colors} label={t('crop.harvestDate')} value={formatDate(crop.harvestDate)} />
          {crop.yieldKg ? <Stat colors={colors} label={t('crop.yield')} value={`${crop.yieldKg} kg`} /> : null}
          {yieldPerAcre ? <Stat colors={colors} label={t('crop.yieldPerAcre')} value={`${yieldPerAcre} kg/${t('crop.acre')}`} /> : null}
          {crop.qualityGrade ? <Stat colors={colors} label={t('crop.grade')} value={crop.qualityGrade} /> : null}
          {crop.sellingPrice ? <Stat colors={colors} label={t('crop.revenue')} value={`Rs. ${crop.sellingPrice.toLocaleString()}`} /> : null}
        </Card>
      ) : (
        <Button title={t('crop.markHarvested')} icon="checkmark-done" style={{ marginTop: spacing.md }} onPress={() => setHarvestOpen(true)} />
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.md }}>
        <Title>{t('crop.treatments')}</Title>
        <Button title={t('crop.addTreatment')} icon="add" onPress={() => setTreatOpen(true)} style={{ minHeight: 44, paddingHorizontal: spacing.md }} />
      </View>
      {logs.length === 0 ? (
        <Card><EmptyState icon="flask-outline" text={t('crop.noTreatments')} /></Card>
      ) : (
        logs.map((log) => (
          <Card key={log.id} style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Ionicons name={log.type === 'PESTICIDE' ? 'bug' : 'flask'} size={20} color={colors.primary} />
                <View style={{ marginLeft: spacing.md, flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: colors.ink }}>{log.productName}</Text>
                  <Body muted style={{ fontSize: font.sm }}>
                    {[t(`crop.${log.type.toLowerCase()}`), log.quantity, log.appliedDate ? formatDate(log.appliedDate) : null].filter(Boolean).join(' · ')}
                  </Body>
                </View>
              </View>
              <Pressable hitSlop={10} onPress={() => removeLog(log.id)}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            </View>
          </Card>
        ))
      )}

      <Button title={t('crop.delete')} variant="danger" icon="trash" style={{ marginTop: spacing.xl }} onPress={confirmDelete} />

      <CropFormModal visible={editOpen} farmId={crop.farmId} initial={crop} onClose={() => setEditOpen(false)} onSaved={() => { setEditOpen(false); load(); }} />
      <HarvestModal
        visible={harvestOpen}
        crop={crop}
        onClose={() => setHarvestOpen(false)}
        onSaved={() => { setHarvestOpen(false); load(); }}
      />
      <TreatmentModal
        visible={treatOpen}
        cropId={cropId}
        onClose={() => setTreatOpen(false)}
        onSaved={() => { setTreatOpen(false); load(); }}
      />
      <StageLogModal
        visible={stageLogOpen}
        cropId={cropId}
        onClose={() => setStageLogOpen(false)}
        onSaved={() => { setStageLogOpen(false); load(); }}
      />
    </Screen>
  );
}

function Meta({ colors, icon, text }: { colors: Palette; icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt }}>
      <Ionicons name={icon} size={14} color={colors.inkSoft} />
      <Text style={{ color: colors.inkSoft, fontSize: font.sm, fontWeight: '600' }}>{text}</Text>
    </View>
  );
}

function Stat({ colors, label, value }: { colors: Palette; label: string; value?: string | null }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Text style={{ color: colors.inkSoft }}>{label}</Text>
      <Text style={{ color: colors.ink, fontWeight: '700' }}>{value ?? '—'}</Text>
    </View>
  );
}
