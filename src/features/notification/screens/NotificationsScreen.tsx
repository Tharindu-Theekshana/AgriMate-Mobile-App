import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, Text, View } from 'react-native';

import { useAppSelector } from '@/app/hooks';
import { Body, Card, EmptyState } from '@/shared/components/ui';
import { font, spacing } from '@/shared/theme/theme';
import { formatDate } from '@/shared/utils/format';
import type { AppNotification } from '@/shared/types/api.types';

import { useColors } from '@/features/theme';
import { selectIsAuthenticated } from '@/features/auth/store/auth.selectors';
import { notificationApi } from '@/features/notification/services/notification.service';
import type { MainStackParamList } from '@/navigation/types';

const ICONS: Record<AppNotification['type'], keyof typeof Ionicons.glyphMap> = {
  OUTBREAK: 'alert-circle',
  REMINDER: 'leaf',
  QA_REPLY: 'chatbubbles',
  SYSTEM: 'information-circle',
  NEWS: 'megaphone',
};

type Props = { navigation: NativeStackNavigationProp<MainStackParamList, 'Notifications'> };

export default function NotificationsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const colors = useColors();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
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

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('notif.inbox'),
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate('SettingsNotifications')} hitSlop={10}>
          <Ionicons name="settings-outline" size={22} color={colors.ink} />
        </Pressable>
      ),
    });
  }, [navigation, t, colors.ink]);

  return (
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
  );
}
