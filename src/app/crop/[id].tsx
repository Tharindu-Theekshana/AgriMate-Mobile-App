import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Modal, Pressable, Text, View } from 'react-native';

import { deleteCrop, getCrop, markHarvested } from '@/data/crops';
import { syncNow } from '@/data/sync';
import { createTreatment, deleteTreatment, listTreatments } from '@/data/treatments';
import type { LocalCrop, LocalTreatment, TreatmentType } from '@/data/types';
import { ChipSelect, DateField } from '@/components/form';
import { CropFormModal } from '@/components/CropFormModal';
import { Body, Button, Card, EmptyState, Loading, Screen, TextField, Title } from '@/components/ui';
import { useColors } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { type Palette, font, radius, spacing } from '@/theme/theme';
import { PADDY_STAGES, cropProgress } from '@/utils/crop';
import { formatDate } from '@/utils/format';

const STATUS_COLOR = (c: Palette, s: string) =>
  s === 'HARVESTED' ? c.info : s === 'FAILED' ? c.danger : c.primary;

export default function CropDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cropId = String(id);
  const { t } = useTranslation();
  const colors = useColors();
  const toast = useToast();
  const router = useRouter();
  const [crop, setCrop] = useState<LocalCrop | null>(null);
  const [logs, setLogs] = useState<LocalTreatment[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [harvestOpen, setHarvestOpen] = useState(false);
  const [treatOpen, setTreatOpen] = useState(false);

  const load = useCallback(async () => {
    const [c, l] = await Promise.all([getCrop(cropId), listTreatments(cropId)]);
    setCrop(c);
    setLogs(l);
  }, [cropId]);

  useFocusEffect(useCallback(() => { load().catch(() => undefined); }, [load]));

  if (!crop) return <Loading />;

  const progress = cropProgress(crop);
  const statusColor = STATUS_COLOR(colors, crop.status);
  const title = crop.variety || t('common.appName');

  function confirmDelete() {
    Alert.alert(t('crop.delete'), t('crop.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteCrop(cropId);
          void syncNow(true);
          toast.success(t('crop.deleted'));
          router.back();
        },
      },
    ]);
  }

  async function removeLog(logId: string) {
    await deleteTreatment(logId);
    void syncNow(true);
    load();
  }

  const yieldPerAcre = crop.yieldKg && crop.areaAcres ? Math.round(crop.yieldKg / crop.areaAcres) : null;

  return (
    <Screen scroll>
      <Stack.Screen
        options={{
          title: t('crop.title'),
          headerRight: () => (
            <Pressable onPress={() => setEditOpen(true)} hitSlop={10}>
              <Ionicons name="create-outline" size={24} color={colors.primary} />
            </Pressable>
          ),
        }}
      />

      {/* Summary */}
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

      {/* Lifecycle */}
      {crop.plantingDate && (
        <Card style={{ marginTop: spacing.md }}>
          <Text style={{ fontWeight: '800', color: colors.ink, fontSize: font.md, marginBottom: spacing.sm }}>{t('crop.lifecycle')}</Text>

          {/* progress bar */}
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

          {/* stage steps */}
          <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
            {PADDY_STAGES.map((s, i) => {
              const done = i < progress.stageIndex;
              const current = i === progress.stageIndex && crop.status !== 'HARVESTED';
              const color = done || current ? colors.primary : colors.inkFaint;
              return (
                <View key={s.key} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name={done ? 'checkmark-circle' : current ? 'ellipse' : 'ellipse-outline'} size={18} color={color} />
                  <Text style={{ marginLeft: spacing.sm, color: current ? colors.ink : colors.inkSoft, fontWeight: current ? '800' : '500' }}>
                    {t(`crop.stages.${s.key}`)}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>
      )}

      {/* Harvest */}
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

      {/* Treatment logs */}
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

function HarvestModal({
  visible,
  crop,
  onClose,
  onSaved,
}: {
  visible: boolean;
  crop: LocalCrop;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const colors = useColors();
  const toast = useToast();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [yieldKg, setYieldKg] = useState('');
  const [grade, setGrade] = useState<string | null>(null);
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await markHarvested(crop, {
        harvestDate: date,
        yieldKg: yieldKg ? Number(yieldKg) : null,
        qualityGrade: grade,
        sellingPrice: price ? Number(price) : null,
      });
      void syncNow(true);
      toast.success(t('crop.harvestSaved'));
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <Screen scroll>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
          <Title>{t('crop.recordHarvest')}</Title>
          <Pressable onPress={onClose}><Ionicons name="close" size={28} color={colors.inkSoft} /></Pressable>
        </View>
        <DateField label={t('crop.harvestDate')} value={date} onChange={setDate} />
        <TextField label={t('crop.yieldKg')} value={yieldKg} onChangeText={setYieldKg} keyboardType="decimal-pad" />
        <ChipSelect
          label={t('crop.grade')}
          value={grade}
          allowClear
          onChange={setGrade}
          options={[
            { value: 'A', label: 'A' },
            { value: 'B', label: 'B' },
            { value: 'C', label: 'C' },
          ]}
        />
        <TextField label={t('crop.priceRs')} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
        <Button title={t('crop.saveHarvest')} icon="checkmark-done" onPress={save} loading={saving} />
      </Screen>
    </Modal>
  );
}

function TreatmentModal({
  visible,
  cropId,
  onClose,
  onSaved,
}: {
  visible: boolean;
  cropId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const colors = useColors();
  const toast = useToast();
  const [product, setProduct] = useState('');
  const [type, setType] = useState<TreatmentType>('FERTILIZER');
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!product.trim()) return;
    setSaving(true);
    try {
      await createTreatment(cropId, { productName: product.trim(), type, quantity: quantity.trim() || null, appliedDate: date });
      void syncNow(true);
      setProduct('');
      setQuantity('');
      toast.success(t('crop.treatmentSaved'));
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <Screen scroll>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
          <Title>{t('crop.addTreatment')}</Title>
          <Pressable onPress={onClose}><Ionicons name="close" size={28} color={colors.inkSoft} /></Pressable>
        </View>
        <ChipSelect
          label={t('crop.type')}
          value={type}
          onChange={(v) => v && setType(v)}
          options={[
            { value: 'FERTILIZER', label: t('crop.fertilizer'), icon: 'flask' },
            { value: 'PESTICIDE', label: t('crop.pesticide'), icon: 'bug' },
          ]}
        />
        <TextField label={t('crop.product')} value={product} onChangeText={setProduct} />
        <TextField label={t('crop.quantity')} placeholder="e.g. 50 kg/acre" value={quantity} onChangeText={setQuantity} />
        <DateField label={t('crop.appliedDate')} value={date} onChange={setDate} />
        <Button title={t('common.save')} onPress={save} loading={saving} />
      </Screen>
    </Modal>
  );
}
