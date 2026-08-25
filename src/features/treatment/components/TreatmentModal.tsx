import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, View } from 'react-native';

import { ChipSelect, DateField } from '@/shared/components/form';
import { Button, Screen, TextField, Title } from '@/shared/components/ui';
import { useToast } from '@/shared/providers/ToastProvider';
import { syncNow } from '@/shared/services/sync/sync';
import { spacing } from '@/shared/theme/theme';

import { useColors } from '@/features/theme';
import { createTreatment } from '../services/treatment.local';
import type { TreatmentType } from '../types/treatment.types';

export function TreatmentModal({
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

  useEffect(() => {
    if (!visible) return;
    setProduct('');
    setType('FERTILIZER');
    setQuantity('');
    setDate(new Date().toISOString().slice(0, 10));
  }, [visible]);

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
