import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { newsApi, notificationApi } from '@/api/endpoints';
import type { News, Scan } from '@/api/types';
import { Body, Button, Card, EmptyState, SectionHeader, SeverityBadge } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/context/ThemeContext';
import { listFarms } from '@/data/farms';
import { listScans } from '@/data/scans';
import type { LocalFarm } from '@/data/types';
import { font, radius, shadow, spacing } from '@/theme/theme';
import { diseaseName, formatConfidence, formatDate, prettifyKey, resolveImageUrl } from '@/utils/format';

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const colors = useColors();
  const { user, isGuest, isAuthenticated } = useAuth();
  const router = useRouter();
  const [farms, setFarms] = useState<LocalFarm[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [unread, setUnread] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    newsApi.list().then(setNews).catch(() => undefined);
    if (isAuthenticated) {
      try {
        const [f, s] = await Promise.all([listFarms(), listScans()]);
        setFarms(f);
        setScans(s.slice(0, 5));
      } catch {
        /* offline resilient */
      }
      notificationApi.list().then((n) => setUnread(n.filter((x) => !x.read).length)).catch(() => undefined);
    }
  }, [isAuthenticated]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {/* Fixed top bar: logo (left) + notification bell (right) */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          backgroundColor: colors.background,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="leaf" size={22} color={colors.primary} />
          </View>
          <Text style={{ marginLeft: spacing.sm, fontSize: font.xl, fontWeight: '800', color: colors.ink }}>{t('common.appName')}</Text>
        </View>
        <Pressable onPress={() => router.push('/notifications')} hitSlop={10}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="notifications-outline" size={22} color={colors.ink} />
            {unread > 0 && (
              <View style={{ position: 'absolute', top: 8, right: 8, minWidth: 16, height: 16, paddingHorizontal: 3, borderRadius: 8, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.background }}>
                <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>{unread > 9 ? '9+' : unread}</Text>
              </View>
            )}
          </View>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />
        }>
        {/* Greeting */}
        <Text style={{ fontSize: font.lg, color: colors.inkSoft, marginBottom: spacing.md }}>
          {t('home.greeting', { name: isGuest ? t('guest.badge') : (user?.name?.split(' ')[0] ?? '') })}
        </Text>

        {/* Scan CTA */}
        <Pressable onPress={() => router.push('/scan')}>
          <View style={{ backgroundColor: colors.primary, borderRadius: radius.xl, padding: spacing.xl, flexDirection: 'row', alignItems: 'center', ...shadow.card }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.white, fontSize: font.xl, fontWeight: '800' }}>{t('home.scanCta')}</Text>
              <Text style={{ color: colors.onPrimaryFaint, fontSize: font.sm, marginTop: 4 }}>{t('home.scanCtaSub')}</Text>
            </View>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="camera" size={30} color={colors.white} />
            </View>
          </View>
        </Pressable>

        {/* Guest prompt */}
        {isGuest && (
          <Card style={{ marginTop: spacing.xl }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
              <Ionicons name="lock-closed" size={20} color={colors.warning} />
              <Text style={{ marginLeft: spacing.sm, fontWeight: '800', color: colors.ink, fontSize: font.md }}>{t('guest.lockedTitle')}</Text>
            </View>
            <Body muted style={{ fontSize: font.sm, marginBottom: spacing.md }}>{t('guest.farmsLocked')}</Body>
            <Button title={t('guest.createAccount')} icon="person-add" onPress={() => router.push('/settings/account')} />
          </Card>
        )}

        {/* Farms (account only) */}
        {isAuthenticated && (
          <View style={{ marginTop: spacing.xl }}>
            <SectionHeader title={t('home.yourFarms')} action={<Pressable onPress={() => router.push('/farms')}><Text style={{ color: colors.primary, fontWeight: '700' }}>{t('home.seeAll')}</Text></Pressable>} />
            {farms.length === 0 ? (
              <Card><EmptyState icon="leaf-outline" text={t('home.noFarms')} /></Card>
            ) : (
              farms.slice(0, 3).map((f) => (
                <Card key={f.id} onPress={() => router.push(`/farm/${f.id}`)} style={{ marginBottom: spacing.sm }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="map" size={22} color={colors.primary} />
                    <View style={{ marginLeft: spacing.md, flex: 1 }}>
                      <Text style={{ fontWeight: '700', color: colors.ink, fontSize: font.md }}>{f.name}</Text>
                      {f.sizeAcres ? <Body muted style={{ fontSize: font.sm }}>{f.sizeAcres} acres</Body> : null}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.inkFaint} />
                  </View>
                </Card>
              ))
            )}
          </View>
        )}

        {/* Recent scans (account only) */}
        {isAuthenticated && scans.length > 0 && (
          <View style={{ marginTop: spacing.xl }}>
            <SectionHeader title={t('home.recentScans')} action={<Pressable onPress={() => router.push('/history')}><Text style={{ color: colors.primary, fontWeight: '700' }}>{t('home.seeAll')}</Text></Pressable>} />
            {scans.map((s) => (
              <Card key={s.id} onPress={() => router.push(`/scan/${s.id}`)} style={{ marginBottom: spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: colors.ink, fontSize: font.md }}>
                      {diseaseName(s.disease, i18n.language) || prettifyKey(s.predictedDisease)}
                    </Text>
                    <Body muted style={{ fontSize: font.sm }}>{formatDate(s.createdAt)} · {formatConfidence(s.confidence)}</Body>
                  </View>
                  <SeverityBadge severity={s.disease?.severity} label={formatConfidence(s.confidence)} />
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* News feed */}
        <View style={{ marginTop: spacing.xl }}>
          <SectionHeader title={t('news.title')} />
          {news.length === 0 ? (
            <Card><EmptyState icon="newspaper-outline" text={t('news.empty')} /></Card>
          ) : (
            news.map((n) => (
              <Card key={n.id} style={{ marginBottom: spacing.md, padding: 0, overflow: 'hidden' }}>
                {n.imageUrl ? (
                  <Image source={{ uri: resolveImageUrl(n.imageUrl) }} style={{ width: '100%', height: 160 }} contentFit="cover" />
                ) : null}
                <View style={{ padding: spacing.lg }}>
                  <Text style={{ color: colors.inkFaint, fontSize: font.xs, marginBottom: 4 }}>{formatDate(n.createdAt)}</Text>
                  <Text style={{ fontWeight: '800', color: colors.ink, fontSize: font.md, marginBottom: 4 }}>{n.title}</Text>
                  <Body muted style={{ fontSize: font.sm }}>{n.description}</Body>
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
