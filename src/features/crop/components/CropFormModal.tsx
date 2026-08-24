import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, View } from 'react-native';

import { ChipSelect, DateField } from '@/shared/components/form';
import { Button, Screen, TextField, Title } from '@/shared/components/ui';
import { useToast } from '@/shared/providers/ToastProvider';
import { spacing } from '@/shared/theme/theme';

import { useColors } from '@/features/theme';
import { createCrop, suggestHarvestDate, updateCrop } from '../services/crop.local';
import type { LocalCrop, Season } from '../types/crop.types';
import { PADDY_STAGES, type StageKey } from '../utils/crop';

export function CropFormModal({
  visible,
  farmId,
  initial,
  onClose,
  onSaved,
}: {
  visible: boolean;
  farmId: string;
  initial?: LocalCrop;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const colors = useColors();
  const toast = useToast();
  const [variety, setVariety] = useState(initial?.variety ?? '');
  const [season, setSeason] = useState<Season | null>(initial?.season ?? null);
  const [area, setArea] = useState(initial?.areaAcres ? String(initial.areaAcres) : '');
  const [plantingDate, setPlantingDate] = useState(initial?.plantingDate ?? '');
  const [growingPeriod, setGrowingPeriod] = useState(
    initial?.growingPeriodDays != null ? String(initial.growingPeriodDays) : '105',
  );
  const [harvestDate, setHarvestDate] = useState(initial?.expectedHarvestDate ?? '');
  const [stage, setStage] = useState<StageKey | null>((initial?.growthStage as StageKey) ?? null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setVariety(initial?.variety ?? '');
    setSeason(initial?.season ?? null);
    setArea(initial?.areaAcres ? String(initial.areaAcres) : '');
    setPlantingDate(initial?.plantingDate ?? '');
    setGrowingPeriod(initial?.growingPeriodDays != null ? String(initial.growingPeriodDays) : '105');
    setHarvestDate(initial?.expectedHarvestDate ?? '');
    setStage((initial?.growthStage as StageKey) ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, initial?.id]);

  const growingPeriodDays = growingPeriod ? Number(growingPeriod) : undefined;

  async function save() {
    setSaving(true);
    const input = {
      variety: variety.trim() || undefined,
      season: season ?? undefined,
      areaAcres: area ? Number(area) : undefined,
      plantingDate: plantingDate || undefined,
      growingPeriodDays,
      expectedHarvestDate:
        harvestDate || (plantingDate ? suggestHarvestDate(plantingDate, growingPeriodDays) ?? undefined : undefined),
      growthStage: stage ?? undefined,
    };
    try {
      if (initial) await updateCrop(initial.id, { ...input, status: initial.status });
      else await createCrop(farmId, input);
      toast.success(initial ? t('crop.updated') : t('crop.added'));
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
          <Title>{initial ? t('crop.edit') : t('crop.add')}</Title>
          <Pressable onPress={onClose}><Ionicons name="close" size={28} color={colors.inkSoft} /></Pressable>
        </View>

        <ChipSelect
          label={t('crop.season')}
          value={season}
          allowClear
          onChange={setSeason}
          options={[
            { value: 'MAHA', label: t('crop.maha'), icon: 'rainy' },
            { value: 'YALA', label: t('crop.yala'), icon: 'sunny' },
          ]}
        />
        <TextField label={t('crop.variety')} placeholder="BG 352" value={variety} onChangeText={setVariety} />
        <TextField label={t('crop.area')} value={area} onChangeText={setArea} keyboardType="decimal-pad" />
        <DateField label={t('crop.plantingDate')} value={plantingDate} onChange={setPlantingDate} placeholder={t('crop.selectDate')} />
        <TextField
          label={t('crop.growingPeriod')}
          value={growingPeriod}
          onChangeText={setGrowingPeriod}
          keyboardType="number-pad"
        />
        <DateField
          label={`${t('crop.harvestDate')} (${t('crop.autoSuggested')})`}
          value={harvestDate || (plantingDate ? suggestHarvestDate(plantingDate, growingPeriodDays) ?? '' : '')}
          onChange={setHarvestDate}
          placeholder={t('crop.selectDate')}
        />
        <ChipSelect<StageKey>
          label={t('crop.stage')}
          value={stage}
          allowClear
          onChange={setStage}
          options={PADDY_STAGES.map((s) => ({ value: s.key, label: t(`crop.stages.${s.key}`) }))}
        />

        <Button title={t('common.save')} onPress={save} loading={saving} style={{ marginTop: spacing.sm }} />
      </Screen>
    </Modal>
  );
}
