import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, View } from 'react-native';

import { ChipSelect, DateField } from '@/shared/components/form';
import { Button, Screen, Title } from '@/shared/components/ui';
import { useToast } from '@/shared/providers/ToastProvider';
import { syncNow } from '@/shared/services/sync/sync';
import { spacing } from '@/shared/theme/theme';

import { useColors } from '@/features/theme';
import { addStageLog } from '../services/stageLog.local';
import { PADDY_STAGES, type StageKey } from '../utils/crop';

export function StageLogModal({
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
  const [stage, setStage] = useState<StageKey | null>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!stage) return;
    setSaving(true);
    try {
      await addStageLog(cropId, stage, date);
      void syncNow(true);
      toast.success(t('crop.stageLogSaved'));
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
          <Title>{t('crop.addStageLog')}</Title>
          <Pressable onPress={onClose}><Ionicons name="close" size={28} color={colors.inkSoft} /></Pressable>
        </View>
        <ChipSelect<StageKey>
          label={t('crop.stage')}
          value={stage}
          onChange={setStage}
          options={PADDY_STAGES.map((s) => ({ value: s.key, label: t(`crop.stages.${s.key}`) }))}
        />
        <DateField label={t('crop.stageReachedDate')} value={date} onChange={setDate} />
        <Button title={t('common.save')} onPress={save} loading={saving} disabled={!stage} />
      </Screen>
    </Modal>
  );
}
