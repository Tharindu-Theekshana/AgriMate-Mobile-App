import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Modal, Pressable, Text, View } from 'react-native';

import { createFarm, listFarms, updateFarm } from '@/data/farms';
import type { FarmCategory, LocalFarm } from '@/data/types';
import { syncNow } from '@/data/sync';
import { AccountGate } from '@/components/AccountGate';
import { Body, Button, Card, EmptyState, Loading, Screen, TextField, Title } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/context/ThemeContext';
import { font, radius, spacing } from '@/theme/theme';

export default function FarmsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [farms, setFarms] = useState<LocalFarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      setFarms(await listFarms());
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!isAuthenticated) return <AccountGate>{null}</AccountGate>;
  if (loading) return <Loading />;

  return (
    <Screen padded={false}>
      <View style={{ padding: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title>{t('farm.farms')}</Title>
        <Button title={t('farm.addFarm')} icon="add" onPress={() => setModalOpen(true)} style={{ minHeight: 44, paddingHorizontal: spacing.md }} />
      </View>

      <FlatList
        data={farms}
        keyExtractor={(f) => String(f.id)}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}
        ListEmptyComponent={<EmptyState icon="leaf-outline" text={t('home.noFarms')} />}
        renderItem={({ item }) => (
          <Card onPress={() => router.push(`/farm/${item.id}`)} style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: colors.pale,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Ionicons name={item.category === 'ANIMAL' ? 'paw' : 'leaf'} size={22} color={colors.primary} />
              </View>
              <View style={{ marginLeft: spacing.md, flex: 1 }}>
                <Text style={{ fontWeight: '700', color: colors.ink, fontSize: font.md }}>{item.name}</Text>
                <Body muted style={{ fontSize: font.sm }}>
                  {[item.category === 'ANIMAL' ? t('farm.categoryAnimal') : t('farm.categoryCrop'), item.sizeAcres ? `${item.sizeAcres} acres` : null, item.soilType].filter(Boolean).join(' · ')}
                </Body>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.inkFaint} />
            </View>
          </Card>
        )}
      />

      <FarmFormModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          load();
        }}
      />
    </Screen>
  );
}

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
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState<FarmCategory>(initial?.category ?? 'CROP');
  const [size, setSize] = useState(initial?.sizeAcres ? String(initial.sizeAcres) : '');
  const [soil, setSoil] = useState(initial?.soilType ?? '');
  const [lat, setLat] = useState<number | null>(initial?.latitude ?? null);
  const [lng, setLng] = useState<number | null>(initial?.longitude ?? null);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  async function useMyLocation() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), 'Location permission denied');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setLat(pos.coords.latitude);
      setLng(pos.coords.longitude);
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    } finally {
      setLocating(false);
    }
  }

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    const body = {
      name: name.trim(),
      category,
      sizeAcres: size ? Number(size) : undefined,
      soilType: soil.trim() || undefined,
      latitude: lat ?? undefined,
      longitude: lng ?? undefined,
    };
    try {
      if (initial) await updateFarm(initial.id, body);
      else await createFarm(body);
      void syncNow(true); // best-effort push if online
      onSaved();
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
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

        {/* Category: crop or animal */}
        <Text style={{ fontSize: font.sm, fontWeight: '600', color: colors.inkSoft, marginBottom: spacing.xs }}>
          {t('farm.category')}
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
          {([
            { key: 'CROP' as FarmCategory, label: t('farm.categoryCrop'), icon: 'leaf' as const },
            { key: 'ANIMAL' as FarmCategory, label: t('farm.categoryAnimal'), icon: 'paw' as const },
          ]).map((opt) => {
            const active = category === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setCategory(opt.key)}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.sm,
                  paddingVertical: spacing.md,
                  borderRadius: radius.md,
                  borderWidth: 1.5,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.pale : colors.surface,
                }}>
                <Ionicons name={opt.icon} size={18} color={active ? colors.primary : colors.inkSoft} />
                <Text style={{ fontWeight: '700', color: active ? colors.primaryDeep : colors.ink }}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <TextField label={t('farm.name')} value={name} onChangeText={setName} />
        <TextField label={t('farm.size')} value={size} onChangeText={setSize} keyboardType="decimal-pad" />
        <TextField label={t('farm.soil')} value={soil} onChangeText={setSoil} />

        <Button
          title={lat != null ? `📍 ${lat.toFixed(4)}, ${lng?.toFixed(4)}` : t('farm.useMyLocation')}
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
