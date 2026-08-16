import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import type { Disease } from '@/api/types';
import { getDisease } from '@/data/diseases';
import { Body, Card, Loading, SeverityBadge } from '@/components/ui';
import { useColors } from '@/context/ThemeContext';
import { font, spacing } from '@/theme/theme';
import { diseaseName } from '@/utils/format';

export default function DiseaseDetailScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const { t, i18n } = useTranslation();
  const colors = useColors();
  const [disease, setDisease] = useState<Disease | null>(null);

  useEffect(() => {
    if (key) getDisease(key).then(setDisease).catch(() => setDisease(null));
  }, [key]);

  if (!disease) return <Loading />;

  return (
    <>
      <Stack.Screen options={{ title: diseaseName(disease, i18n.language) }} />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
        <Text style={{ fontSize: font.xxl, fontWeight: '800', color: colors.ink }}>{diseaseName(disease, i18n.language)}</Text>
        {disease.scientificName ? (
          <Body muted style={{ fontStyle: 'italic', marginTop: 2 }}>{disease.scientificName}</Body>
        ) : null}
        <View style={{ marginTop: spacing.md, marginBottom: spacing.lg }}>
          <SeverityBadge severity={disease.severity} label={`${t('learn.severity')}: ${t(`severity.${disease.severity}`)}`} />
        </View>

        {disease.symptoms ? <Block icon="eye" title={t('result.symptoms')} body={disease.symptoms} /> : null}
        {disease.cause ? <Block icon="bug" title={t('result.cause')} body={disease.cause} /> : null}
        {disease.treatment ? <Block icon="medkit" title={t('result.treatment')} body={disease.treatment} highlight /> : null}
        {disease.prevention ? <Block icon="shield-checkmark" title={t('result.prevention')} body={disease.prevention} /> : null}
      </ScrollView>
    </>
  );
}

function Block({
  icon,
  title,
  body,
  highlight,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  highlight?: boolean;
}) {
  const colors = useColors();
  return (
    <Card style={{ marginBottom: spacing.sm, backgroundColor: highlight ? colors.pale : colors.surface, borderColor: highlight ? colors.accent : colors.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <Ionicons name={icon} size={18} color={colors.primary} />
        <Text style={{ marginLeft: spacing.sm, fontWeight: '700', color: colors.primaryDeep }}>{title}</Text>
      </View>
      <Text style={{ color: colors.ink, lineHeight: 22 }}>{body}</Text>
    </Card>
  );
}
