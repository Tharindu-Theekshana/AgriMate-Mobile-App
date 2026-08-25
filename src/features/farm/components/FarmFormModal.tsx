import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, View } from 'react-native';

import { Button, Screen, TextField, Title } from '@/shared/components/ui';
import { syncNow } from '@/shared/services/sync/sync';
import { spacing } from '@/shared/theme/theme';

import { useColors } from '@/features/theme';
import { useToast } from '@/shared/providers/ToastProvider';
import { createFarm, updateFarm } from '../services/farm.local';
import type { LocalFarm } from '../types/farm.types';

export function FarmFormModal({
  visible,
  initial,
  onClose,
  onSaved,
}: {
  visible: boolean;
  initial?: LocalFarm;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const colors = useColors();
  const toast = useToast();
  const [name, setName] = useState(initial?.name ?? '');
  const [size, setSize] = useState(initial?.sizeAcres ? String(initial.sizeAcres) : '');
  const [soil, setSoil] = useState(initial?.soilType ?? '');
  const [lat, setLat] = useState<number | null>(initial?.latitude ?? null);
  const [lng, setLng] = useState<number | null>(initial?.longitude ?? null);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(initial?.name ?? '');
    setSize(initial?.sizeAcres ? String(initial.sizeAcres) : '');
    setSoil(initial?.soilType ?? '');
    setLat(initial?.latitude ?? null);
    setLng(initial?.longitude ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, initial?.id]);

  async function useMyLocation() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        toast.error('Location permission denied')
        return;
      }
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        toast.error('Please turn on location services on your device');
        return;
      }
      let pos = await Location.getLastKnownPositionAsync();
      console.log('last known position', pos);
      if (!pos) {
        pos = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Location request timed out')), 15000)),
        ]);
        console.log('fresh position', pos);
      }
      setLat(pos.coords.latitude);
      setLng(pos.coords.longitude);
      console.log('location got', pos.coords.latitude, pos.coords.longitude)
    } catch (e) {
      console.log('location error', e);
      toast.error(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLocating(false);
    }
  }

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    const body = {
      name: name.trim(),
      sizeAcres: size ? Number(size) : undefined,
      soilType: soil.trim() || undefined,
      latitude: lat ?? undefined,
      longitude: lng ?? undefined,
    };
    try {
      console.log("saving farm", body)
      if (initial) await updateFarm(initial.id, body);
      else await createFarm(body);
      void syncNow(true);
      onSaved();
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <Screen scroll>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
          <Title>{initial ? t('farm.editFarm') : t('farm.addFarm')}</Title>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={28} color={colors.inkSoft} />
          </Pressable>
        </View>

        <TextField label={t('farm.name')} value={name} onChangeText={setName} />
        <TextField label={t('farm.size')} value={size} onChangeText={setSize} keyboardType="decimal-pad" />
        <TextField label={t('farm.soil')} value={soil} onChangeText={setSoil} />

        <Button
          title={lat != null ? `${lat.toFixed(4)}, ${lng?.toFixed(4)}` : t('farm.useMyLocation')}
          variant="secondary"
          icon="location"
          loading={locating}
          onPress={useMyLocation}
          style={{ marginBottom: spacing.lg }}
        />

        <Button title={t('common.save')} onPress={save} loading={saving} />
      </Screen>
    </Modal>
  );
}
