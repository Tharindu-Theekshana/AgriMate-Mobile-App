import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, Text, View } from 'react-native';

import type { Disease, Scan } from '@/api/types';
import { getDiseases } from '@/data/diseases';
import { listScans } from '@/data/scans';
import { AccountGate } from '@/components/AccountGate';
import { Body, Card, EmptyState, Screen, SeverityBadge, Title } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/context/ThemeContext';
import { font, radius, spacing } from '@/theme/theme';
import { diseaseName, formatConfidence, formatDate, prettifyKey } from '@/utils/format';

export default function HistoryScreen() {
  const { t, i18n } = useTranslation();
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [scans, setScans] = useState<Scan[]>([]);
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [filter, setFilter] = useState<string | null>(null);

  const load = useCallback(async (disease: string | null) => {
    if (!isAuthenticated) return;
    setScans(await listScans(disease)); // offline-readable cache
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      load(filter);
      getDiseases().then(setDiseases).catch(() => undefined);
    }, [load, filter]),
  );

  if (!isAuthenticated) return <AccountGate>{null}</AccountGate>;

  return (
    <Screen padded={false}>
      <View style={{ padding: spacing.lg, paddingBottom: spacing.sm }}>
        <Title>{t('history.title')}</Title>
      </View>

      {/* Filter chips */}
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
        renderItem={({ item }) => (
          <Card onPress={() => router.push(`/scan/${item.id}`)} style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, paddingRight: spacing.sm }}>
                <Text style={{ fontWeight: '700', color: colors.ink, fontSize: font.md }}>
                  {diseaseName(item.disease, i18n.language) || prettifyKey(item.predictedDisease)}
                </Text>
                <Body muted style={{ fontSize: font.sm }}>
                  {formatDate(item.createdAt)}
                  {item.latitude ? '  ·  📍' : ''}
                </Body>
              </View>
              <SeverityBadge severity={item.disease?.severity} label={formatConfidence(item.confidence)} />
              <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} style={{ marginLeft: spacing.sm }} />
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}
