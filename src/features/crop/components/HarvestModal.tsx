import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, View } from 'react-native';

import { ChipSelect, DateField } from '@/shared/components/form';
import { Button, Screen, TextField, Title } from '@/shared/components/ui';
import { useToast } from '@/shared/providers/ToastProvider';
import { syncNow } from '@/shared/services/sync/sync';
import { spacing } from '@/shared/theme/theme';

import { useColors } from '@/features/theme';
import { markHarvested } from '../services/crop.local';
import type { LocalCrop } from '../types/crop.types';

export function HarvestModal({
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
