import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, Text, View } from 'react-native';

import { notificationApi } from '@/api/endpoints';
import type { AppNotification } from '@/api/types';
import { Body, Card, EmptyState } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/context/ThemeContext';
import { font, spacing } from '@/theme/theme';
import { formatDate } from '@/utils/format';

const ICONS: Record<AppNotification['type'], keyof typeof Ionicons.glyphMap> = {
  OUTBREAK: 'alert-circle',
  REMINDER: 'leaf',
  QA_REPLY: 'chatbubbles',
  SYSTEM: 'information-circle',
  NEWS: 'megaphone',
};

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);

  const load = useCallback(() => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }
    notificationApi.list().then(setItems).catch(() => setItems([]));
    notificationApi.markAllRead().catch(() => undefined);
  }, [isAuthenticated]);

  useFocusEffect(useCallback(() => load(), [load]));

  return (
    <>
      <Stack.Screen
        options={{
          title: t('notif.inbox'),
          headerRight: () => (
            <Pressable onPress={() => router.push('/settings/notifications')} hitSlop={10}>
              <Ionicons name="settings-outline" size={22} color={colors.ink} />
            </Pressable>
          ),
        }}
      />
      <FlatList
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 }}
        data={items}
        keyExtractor={(n) => String(n.id)}
        ListEmptyComponent={
          <EmptyState icon="notifications-off-outline" text={isAuthenticated ? t('notif.empty') : t('notif.registeredOnly')} />
        }
        renderItem={({ item }) => (
          <Card style={{ marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={ICONS[item.type]} size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={{ fontWeight: '700', color: colors.ink, fontSize: font.md }}>{item.title}</Text>
              {item.body ? <Body muted style={{ fontSize: font.sm, marginTop: 2 }}>{item.body}</Body> : null}
              <Text style={{ color: colors.inkFaint, fontSize: font.xs, marginTop: 4 }}>{formatDate(item.createdAt)}</Text>
            </View>
            {!item.read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginLeft: spacing.sm }} />}
          </Card>
        )}
      />
    </>
  );
}
