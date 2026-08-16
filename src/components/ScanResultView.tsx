import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import type { Scan } from '@/api/types';
import { Body, Button, Card, SeverityBadge } from '@/components/ui';
import { useColors } from '@/context/ThemeContext';
import { font, radius, spacing } from '@/theme/theme';
import { diseaseName, formatConfidence, prettifyKey, resolveImageUrl } from '@/utils/format';

export function ScanResultView({ scan, showActions = true }: { scan: Scan; showActions?: boolean }) {
  const { t, i18n } = useTranslation();
  const colors = useColors();
  const router = useRouter();
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

      {/* Demo-mode notice when the ML model is not trained yet */}
      {scan.modelMocked && (
        <Card style={{ backgroundColor: '#FFF6E5', borderColor: colors.warning, marginBottom: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="information-circle" size={20} color={colors.warning} />
            <Body style={{ marginLeft: spacing.sm, flex: 1, fontSize: font.sm }}>{t('result.mockNotice')}</Body>
          </View>
        </Card>
      )}

      {/* Diagnosis header */}
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

      {/* Low-confidence prompt */}
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
              onPress={() => router.push(`/disease/${scan.predictedDisease}`)}
            />
          )}
        </Card>
      )}

      {/* Treatment / prevention / symptoms / cause */}
      {scan.disease && (
        <View style={{ marginTop: spacing.md }}>
          {scan.disease.scientificName ? (
            <InfoBlock icon="flask" title={t('learn.scientificName')} body={scan.disease.scientificName} italic />
          ) : null}
          {scan.disease.symptoms ? <InfoBlock icon="eye" title={t('result.symptoms')} body={scan.disease.symptoms} /> : null}
          {scan.disease.cause ? <InfoBlock icon="bug" title={t('result.cause')} body={scan.disease.cause} /> : null}
          {scan.disease.treatment ? (
            <InfoBlock icon="medkit" title={t('result.treatment')} body={scan.disease.treatment} highlight />
          ) : null}
          {scan.disease.prevention ? <InfoBlock icon="shield-checkmark" title={t('result.prevention')} body={scan.disease.prevention} /> : null}
        </View>
      )}

      {/* Other possibilities (top-3) */}
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
        <Button title={t('result.scanAgain')} icon="scan" style={{ marginTop: spacing.lg }} onPress={() => router.replace('/scan')} />
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
