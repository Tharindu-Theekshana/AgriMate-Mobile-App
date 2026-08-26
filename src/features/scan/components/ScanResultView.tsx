import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { Body, Button, Card, SeverityBadge } from '@/shared/components/ui';
import { font, radius, spacing } from '@/shared/theme/theme';
import type { Scan } from '@/shared/types/api.types';
import { diseaseField, diseaseName, formatConfidence, prettifyKey, resolveImageUrl } from '@/shared/utils/format';

import { useColors } from '@/features/theme';
import type { MainStackParamList } from '@/navigation/types';

export function ScanResultView({ scan, showActions = true }: { scan: Scan; showActions?: boolean }) {
  const { t, i18n } = useTranslation();
  const colors = useColors();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const isHealthy = scan.predictedDisease === 'healthy';
  const name = diseaseName(scan.disease, i18n.language) || prettifyKey(scan.predictedDisease);
  const accent = isHealthy ? colors.healthy : scan.lowConfidence ? colors.warning : colors.danger;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
      {scan.imageUrl ? (
        <Image
          source={{ uri: resolveImageUrl(scan.imageUrl) }}
          style={{ width: '100%', aspectRatio: 1, borderRadius: radius.lg, marginBottom: spacing.lg }}
          contentFit="cover"
        />
      ) : null}

      {scan.modelMocked && (
        <Card style={{ backgroundColor: '#FFF6E5', borderColor: colors.warning, marginBottom: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="information-circle" size={20} color={colors.warning} />
            <Body style={{ marginLeft: spacing.sm, flex: 1, fontSize: font.sm }}>{t('result.mockNotice')}</Body>
          </View>
        </Card>
      )}

      <Card style={{ borderLeftWidth: 5, borderLeftColor: accent }}>
        <Body muted style={{ fontSize: font.sm }}>{t('result.title')}</Body>
        <Text style={{ fontSize: font.xxl, fontWeight: '800', color: colors.ink, marginVertical: 4 }}>
          {isHealthy ? t('result.healthy') : name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm }}>
          <SeverityBadge severity={scan.disease?.severity} label={t(`severity.${scan.disease?.severity ?? 'NONE'}`)} />
          <Text style={{ color: colors.inkSoft, fontWeight: '700' }}>
            {t('result.confidence')}: {formatConfidence(scan.confidence)}
          </Text>
        </View>
      </Card>

      {scan.lowConfidence && !isHealthy && (
        <Card style={{ backgroundColor: '#FCEEED', borderColor: colors.danger, marginTop: spacing.md }}>
          <Text style={{ fontWeight: '700', color: colors.danger, marginBottom: 4 }}>{t('result.lowConfidenceTitle')}</Text>
          <Body style={{ fontSize: font.sm }}>{t('result.lowConfidenceBody')}</Body>
          {showActions && (
            <Button
              title={t('result.askAgronomist')}
              variant="secondary"
              icon="information-circle"
              style={{ marginTop: spacing.md }}
              onPress={() => navigation.navigate('DiseaseDetail', { diseaseKey: scan.predictedDisease })}
            />
          )}
        </Card>
      )}

      {scan.disease && (
        <View style={{ marginTop: spacing.md }}>
          {scan.disease.scientificName ? (
            <InfoBlock icon="flask" title={t('learn.scientificName')} body={scan.disease.scientificName} italic />
          ) : null}
          {diseaseField(scan.disease, 'symptoms', i18n.language) ? (
            <InfoBlock icon="eye" title={t('result.symptoms')} body={diseaseField(scan.disease, 'symptoms', i18n.language)!} />
          ) : null}
          {diseaseField(scan.disease, 'cause', i18n.language) ? (
            <InfoBlock icon="bug" title={t('result.cause')} body={diseaseField(scan.disease, 'cause', i18n.language)!} />
          ) : null}
          {diseaseField(scan.disease, 'treatment', i18n.language) ? (
            <InfoBlock icon="medkit" title={t('result.treatment')} body={diseaseField(scan.disease, 'treatment', i18n.language)!} highlight />
          ) : null}
          {diseaseField(scan.disease, 'prevention', i18n.language) ? (
            <InfoBlock icon="shield-checkmark" title={t('result.prevention')} body={diseaseField(scan.disease, 'prevention', i18n.language)!} />
          ) : null}
        </View>
      )}

      {scan.top3.length > 1 && (
        <View style={{ marginTop: spacing.md }}>
          <Text style={{ fontWeight: '700', color: colors.ink, marginBottom: spacing.sm }}>{t('result.topPredictions')}</Text>
          {scan.top3.slice(1).map((p) => (
            <View key={p.disease} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <Body>{prettifyKey(p.disease)}</Body>
              <Body muted>{formatConfidence(p.confidence)}</Body>
            </View>
          ))}
        </View>
      )}

      {showActions && (
        <Button title={t('result.scanAgain')} icon="scan" style={{ marginTop: spacing.lg }} onPress={() => navigation.goBack()} />
      )}
    </ScrollView>
  );
}

function InfoBlock({
  icon,
  title,
  body,
  highlight,
  italic,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  highlight?: boolean;
  italic?: boolean;
}) {
  const colors = useColors();
  return (
    <Card style={{ marginBottom: spacing.sm, backgroundColor: highlight ? colors.pale : colors.surface, borderColor: highlight ? colors.accent : colors.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <Ionicons name={icon} size={18} color={colors.primary} />
        <Text style={{ marginLeft: spacing.sm, fontWeight: '700', color: colors.primaryDeep }}>{title}</Text>
      </View>
      <Text style={{ color: colors.ink, lineHeight: 22, fontStyle: italic ? 'italic' : 'normal' }}>{body}</Text>
    </Card>
  );
}
