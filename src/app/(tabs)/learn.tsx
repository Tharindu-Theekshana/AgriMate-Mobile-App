import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Text, View } from 'react-native';

import type { Disease } from '@/api/types';
import { getDiseases } from '@/data/diseases';
import { Body, Card, Screen, SeverityBadge, TextField, Title } from '@/components/ui';
import { useColors } from '@/context/ThemeContext';
import { font, spacing } from '@/theme/theme';
import { diseaseName } from '@/utils/format';

export default function LearnScreen() {
  const { t, i18n } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [query, setQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      getDiseases().then(setDiseases).catch(() => undefined);
    }, []),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return diseases;
    return diseases.filter((d) =>
      [d.nameEn, d.nameSi, d.nameTa, d.scientificName].some((n) => n?.toLowerCase().includes(q)),
    );
  }, [diseases, query]);

  return (
    <Screen padded={false}>
      <View style={{ padding: spacing.lg, paddingBottom: spacing.sm }}>
        <Title>{t('learn.title')}</Title>
        <Body muted style={{ marginTop: 2, marginBottom: spacing.md }}>{t('learn.subtitle')}</Body>
        <TextField placeholder={t('learn.search')} value={query} onChangeText={setQuery} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(d) => d.diseaseKey}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}
        renderItem={({ item }) => (
          <Card onPress={() => router.push(`/disease/${item.diseaseKey}`)} style={{ marginBottom: spacing.sm }}>
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
                <Ionicons name={item.diseaseKey === 'healthy' ? 'checkmark-circle' : 'leaf'} size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={{ fontWeight: '700', color: colors.ink, fontSize: font.md }}>
                  {diseaseName(item, i18n.language)}
                </Text>
                {item.scientificName ? (
                  <Body muted style={{ fontSize: font.sm, fontStyle: 'italic' }}>{item.scientificName}</Body>
                ) : null}
              </View>
              <SeverityBadge severity={item.severity} label={t(`severity.${item.severity}`)} />
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}
