import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Body, Button, Card, EmptyState, SectionHeader, SeverityBadge } from '@/shared/components/ui';
import { font, radius, shadow, spacing } from '@/shared/theme/theme';
import type { News, Scan } from '@/shared/types/api.types';
import { diseaseName, formatConfidence, formatDate, prettifyKey, resolveImageUrl } from '@/shared/utils/format';

import { useAppSelector } from '@/app/hooks';
import { selectIsAuthenticated, selectIsGuest, selectUser } from '@/features/auth/store/auth.selectors';
import { listFarms } from '@/features/farm/services/farm.local';
import type { LocalFarm } from '@/features/farm/types/farm.types';
import { newsApi } from '@/features/news/services/news.service';
import { notificationApi } from '@/features/notification/services/notification.service';
import { listScans } from '@/features/scan/services/scan.local';
import { useColors } from '@/features/theme';
import type { MainStackParamList } from '@/navigation/types';

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const colors = useColors();
  const user = useAppSelector(selectUser);
  const isGuest = useAppSelector(selectIsGuest);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
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
      }
      notificationApi.list().then((n) => setUnread(n.filter((x) => !x.read).length)).catch(() => undefined);
    }
  }, [isAuthenticated]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
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
          <Image source={require('../../../../assets/images/logo.png')} style={{ width: 36, height: 36 }} contentFit="contain" />
          <Text style={{ marginLeft: spacing.sm, fontSize: font.xl, fontWeight: '800', color: colors.ink }}>{t('common.appName')}</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('Notifications')} hitSlop={10}>
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
        <Text style={{ fontSize: font.lg, color: colors.inkSoft, marginBottom: spacing.md }}>
          {t('home.greeting', { name: isGuest ? t('guest.badge') : (user?.name?.split(' ')[0] ?? '') })}
        </Text>

        <Pressable onPress={() => navigation.navigate('Tabs', { screen: 'Scan' })}>
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

        {isGuest && (
          <Card style={{ marginTop: spacing.xl }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
              <Ionicons name="lock-closed" size={20} color={colors.warning} />
              <Text style={{ marginLeft: spacing.sm, fontWeight: '800', color: colors.ink, fontSize: font.md }}>{t('guest.lockedTitle')}</Text>
            </View>
            <Body muted style={{ fontSize: font.sm, marginBottom: spacing.md }}>{t('guest.farmsLocked')}</Body>
            <Button title={t('guest.createAccount')} icon="person-add" onPress={() => navigation.navigate('SettingsAccount')} />
          </Card>
        )}

        {isAuthenticated && (
          <View style={{ marginTop: spacing.xl }}>
            <SectionHeader title={t('home.yourFarms')} action={<Pressable onPress={() => navigation.navigate('Tabs', { screen: 'Farms' })}><Text style={{ color: colors.primary, fontWeight: '700' }}>{t('home.seeAll')}</Text></Pressable>} />
            {farms.length === 0 ? (
              <Card><EmptyState icon="leaf-outline" text={t('home.noFarms')} /></Card>
            ) : (
              farms.slice(0, 3).map((f) => (
                <Card key={f.id} onPress={() => navigation.navigate('FarmDetail', { farmId: f.id })} style={{ marginBottom: spacing.sm }}>
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

        {isAuthenticated && scans.length > 0 && (
          <View style={{ marginTop: spacing.xl }}>
            <SectionHeader title={t('home.recentScans')} action={<Pressable onPress={() => navigation.navigate('History')}><Text style={{ color: colors.primary, fontWeight: '700' }}>{t('home.seeAll')}</Text></Pressable>} />
            {scans.map((s) => (
              <Card key={s.id} onPress={() => navigation.navigate('ScanDetail', { scanId: s.id })} style={{ marginBottom: spacing.sm }}>
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
