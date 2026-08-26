import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, Text, View } from 'react-native';

import { Body, Card, EmptyState, Screen, SeverityBadge, Title } from '@/shared/components/ui';
import { font, radius, spacing } from '@/shared/theme/theme';
import type { Disease, Scan } from '@/shared/types/api.types';
import { diseaseName, formatConfidence, formatDate, prettifyKey } from '@/shared/utils/format';

import { useAppSelector } from '@/app/hooks';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { selectIsAuthenticated } from '@/features/auth/store/auth.selectors';
import { getDiseases } from '@/features/disease/services/disease.local';
import { getCropByServerId } from '@/features/crop/services/crop.local';
import { getFarmByServerId } from '@/features/farm/services/farm.local';
import { useColors } from '@/features/theme';
import type { MainStackParamList } from '@/navigation/types';
import { listScans } from '../services/scan.local';

type Props = NativeStackScreenProps<MainStackParamList, 'History'>;

export default function HistoryScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const colors = useColors();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [scans, setScans] = useState<Scan[]>([]);
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [farmNames, setFarmNames] = useState<Record<number, string>>({});
  const [cropNames, setCropNames] = useState<Record<number, string>>({});

  const load = useCallback(async (disease: string | null) => {
    if (!isAuthenticated) return;
    const list = await listScans(disease);
    setScans(list);

    const farmIds = [...new Set(list.map((s) => s.farmId).filter((id): id is number => id != null))];
    const cropIds = [...new Set(list.map((s) => s.cropId).filter((id): id is number => id != null))];
    const [farmEntries, cropEntries] = await Promise.all([
      Promise.all(farmIds.map(async (id) => [id, (await getFarmByServerId(id))?.name] as const)),
      Promise.all(cropIds.map(async (id) => [id, (await getCropByServerId(id))?.variety] as const)),
    ]);
    setFarmNames(Object.fromEntries(farmEntries.filter((e): e is [number, string] => !!e[1])));
    setCropNames(Object.fromEntries(cropEntries.filter((e): e is [number, string] => !!e[1])));
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      load(filter);
      getDiseases().then(setDiseases).catch(() => undefined);
    }, [load, filter]),
  );

  if (!isAuthenticated) return <ProtectedRoute>{null}</ProtectedRoute>;

  return (
    <Screen padded={false}>
      <View style={{ padding: spacing.lg, paddingBottom: spacing.sm }}>
        <Title>{t('history.title')}</Title>
      </View>

      <View style={{ height: 44 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}
          data={[{ diseaseKey: '', nameEn: t('history.filterAll') } as Disease, ...diseases]}
          keyExtractor={(d) => d.diseaseKey || 'all'}
          renderItem={({ item }) => {
            const key = item.diseaseKey || null;
            const active = filter === key;
            return (
              <Pressable
                onPress={() => setFilter(key)}
                style={{
                  paddingHorizontal: spacing.lg,
                  height: 36,
                  justifyContent: 'center',
                  borderRadius: radius.pill,
                  borderWidth: 1.5,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.pale : colors.surface,
                }}>
                <Text style={{ color: active ? colors.primaryDeep : colors.ink, fontWeight: '600' }}>
                  {item.diseaseKey ? diseaseName(item, i18n.language) : item.nameEn}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      <FlatList
        data={scans}
        keyExtractor={(s) => String(s.id)}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
        ListEmptyComponent={<EmptyState icon="time-outline" text={t('history.empty')} />}
        renderItem={({ item }) => {
          const farmName = item.farmId != null ? farmNames[item.farmId] : null;
          const cropName = item.cropId != null ? cropNames[item.cropId] : null;
          return (
            <Card onPress={() => navigation.navigate('ScanDetail', { scanId: item.id })} style={{ marginBottom: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, paddingRight: spacing.sm }}>
                  <Text style={{ fontWeight: '700', color: colors.ink, fontSize: font.md }}>
                    {diseaseName(item.disease, i18n.language) || prettifyKey(item.predictedDisease)}
                  </Text>
                  {(farmName || cropName) && (
                    <Body muted style={{ fontSize: font.sm }}>
                      {[farmName, cropName].filter(Boolean).join(' · ')}
                    </Body>
                  )}
                  <Body muted style={{ fontSize: font.sm }}>
                    {formatDate(item.createdAt)}
                    {item.latitude ? '  ·  📍' : ''}
                  </Body>
                </View>
                <SeverityBadge severity={item.disease?.severity} label={formatConfidence(item.confidence)} />
                <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} style={{ marginLeft: spacing.sm }} />
              </View>
            </Card>
          );
        }}
      />
    </Screen>
  );
}
