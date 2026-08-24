import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { Body, Card, Loading, SeverityBadge } from '@/shared/components/ui';
import { font, spacing } from '@/shared/theme/theme';
import { diseaseName } from '@/shared/utils/format';
import type { Disease } from '@/shared/types/api.types';

import { useColors } from '@/features/theme';
import { getDisease } from '@/features/disease/services/disease.local';
import type { MainStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'DiseaseDetail'>;

export default function DiseaseDetailScreen({ route, navigation }: Props) {
  const { diseaseKey } = route.params;
  const { t, i18n } = useTranslation();
  const colors = useColors();
  const [disease, setDisease] = useState<Disease | null>(null);

  useEffect(() => {
    if (diseaseKey) getDisease(diseaseKey).then(setDisease).catch(() => setDisease(null));
  }, [diseaseKey]);

  useEffect(() => {
    if (disease) navigation.setOptions({ title: diseaseName(disease, i18n.language) });
  }, [disease, i18n.language, navigation]);

  if (!disease) return <Loading />;

  return (
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
