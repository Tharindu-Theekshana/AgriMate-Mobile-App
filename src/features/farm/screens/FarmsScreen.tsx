import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Text, View } from 'react-native';

import { Body, Button, Card, EmptyState, Loading, Screen, Title } from '@/shared/components/ui';
import { font, spacing } from '@/shared/theme/theme';

import { useColors } from '@/features/theme';
import { useAppSelector } from '@/app/hooks';
import { selectIsAuthenticated } from '@/features/auth/store/auth.selectors';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import type { MainStackParamList } from '@/navigation/types';
import { listFarms } from '../services/farm.local';
import type { LocalFarm } from '../types/farm.types';
import { FarmFormModal } from '../components/FarmFormModal';

export default function FarmsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [farms, setFarms] = useState<LocalFarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      setFarms(await listFarms());
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!isAuthenticated) return <ProtectedRoute>{null}</ProtectedRoute>;
  if (loading) return <Loading />;

  return (
    <Screen padded={false}>
      <View style={{ padding: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title>{t('farm.farms')}</Title>
        <Button title={t('farm.addFarm')} icon="add" onPress={() => setModalOpen(true)} style={{ minHeight: 44, paddingHorizontal: spacing.md }} />
      </View>

      <FlatList
        data={farms}
        keyExtractor={(f) => String(f.id)}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}
        ListEmptyComponent={<EmptyState icon="leaf-outline" text={t('home.noFarms')} />}
        renderItem={({ item }) => (
          <Card onPress={() => navigation.navigate('FarmDetail', { farmId: item.id })} style={{ marginBottom: spacing.sm }}>
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
                <Ionicons name="leaf" size={22} color={colors.primary} />
              </View>
              <View style={{ marginLeft: spacing.md, flex: 1 }}>
                <Text style={{ fontWeight: '700', color: colors.ink, fontSize: font.md }}>{item.name}</Text>
                <Body muted style={{ fontSize: font.sm }}>
                  {[item.sizeAcres ? `${item.sizeAcres} acres` : null, item.soilType].filter(Boolean).join(' · ')}
                </Body>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.inkFaint} />
            </View>
          </Card>
        )}
      />

      <FarmFormModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          load();
        }}
      />
    </Screen>
  );
}
