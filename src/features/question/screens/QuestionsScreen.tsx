import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, Text, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Avatar, Body, EmptyState, Loading, Screen } from '@/shared/components/ui';
import { font, radius, spacing, type Palette } from '@/shared/theme/theme';
import type { Question } from '@/shared/types/api.types';
import { formatDate } from '@/shared/utils/format';

import { AgronomistLockedView } from '@/features/agronomist/components/AgronomistLockedView';
import { selectUser } from '@/features/auth/store/auth.selectors';
import { refreshUserThunk } from '@/features/auth/store/auth.slice';
import { useColors } from '@/features/theme';
import type { MainStackParamList } from '@/navigation/types';
import { questionApi } from '../services/question.service';

const STATUS_LABEL_KEY: Record<Question['status'], string> = {
  OPEN: 'question.statusOpen',
  ANSWERED: 'question.statusAnswered',
  CLOSED: 'question.statusClosed',
};

const STATUS_COLOR_KEY: Record<Question['status'], keyof Palette> = {
  OPEN: 'warning',
  ANSWERED: 'primary',
  CLOSED: 'inkFaint',
};

type QuestionFilter = 'ALL' | 'UNANSWERED' | 'ANSWERED';

const FILTERS: { key: QuestionFilter; labelKey: string }[] = [
  { key: 'ALL', labelKey: 'question.filterAll' },
  { key: 'UNANSWERED', labelKey: 'question.filterUnanswered' },
  { key: 'ANSWERED', labelKey: 'question.filterAnswered' },
];

export default function QuestionsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const user = useAppSelector(selectUser);
  const [items, setItems] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<QuestionFilter>('ALL');

  const isAgronomist = user?.role === 'AGRONOMIST';
  const locked = isAgronomist && user?.agronomistStatus !== 'APPROVED';

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('question.title') });
  }, [navigation, t]);

  useFocusEffect(
    useCallback(() => {
      if (isAgronomist) dispatch(refreshUserThunk());
    }, [dispatch, isAgronomist]),
  );

  const load = useCallback(() => {
    if (locked) {
      setLoading(false);
      return;
    }
    questionApi
      .list()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [locked]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (locked) {
    return <AgronomistLockedView status={user?.agronomistStatus ?? 'PENDING'} proofUrl={user?.agronomistProofUrl} />;
  }
  if (loading) return <Loading />;

  const filtered = items.filter((q) => {
    if (filter === 'UNANSWERED') return q.status === 'OPEN';
    if (filter === 'ANSWERED') return q.status !== 'OPEN';
    return true;
  });

  const displayedItems = isAgronomist
    ? [...filtered].sort((a, b) => Number(a.status !== 'OPEN') - Number(b.status !== 'OPEN'))
    : filtered;

  return (
    <Screen padded={false}>
      {!isAgronomist ? (
        <View style={{ padding: spacing.lg, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Pressable
            onPress={() => navigation.navigate('AskQuestion')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 8,
              paddingHorizontal: spacing.md,
              borderRadius: radius.pill,
              backgroundColor: colors.primary,
            }}>
            <Ionicons name="add" size={18} color={colors.white} />
            <Text style={{ marginLeft: 4, color: colors.white, fontWeight: '700', fontSize: font.sm }}>
              {t('question.newQuestion')}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.sm }}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: spacing.md,
                  borderRadius: radius.pill,
                  borderWidth: 1.5,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.pale : colors.surface,
                }}>
                <Text style={{ fontSize: font.sm, fontWeight: '700', color: active ? colors.primaryDeep : colors.inkSoft }}>
                  {t(f.labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <FlatList
        data={displayedItems}
        keyExtractor={(q) => String(q.id)}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xxl,
          flexGrow: 1,
        }}
        ListEmptyComponent={
          <EmptyState icon="chatbubbles-outline" text={isAgronomist ? t('question.emptyAgronomist') : t('question.empty')} />
        }
        renderItem={({ item }) => {
          const statusColor = colors[STATUS_COLOR_KEY[item.status]];
          return (
            <Pressable
              onPress={() => navigation.navigate('QuestionDetail', { questionId: item.id })}
              style={{
                flexDirection: 'row',
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.border,
                padding: spacing.md,
                marginBottom: spacing.sm,
              }}>
              {isAgronomist && (
                <Avatar uri={item.farmerPhotoUrl} name={item.farmerName} size={40} style={{ marginRight: spacing.md }} />
              )}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={{ flex: 1, fontWeight: '700', color: colors.ink, fontSize: font.md }}>{item.title}</Text>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: radius.pill,
                      backgroundColor: `${statusColor}1A`,
                      marginLeft: spacing.sm,
                    }}>
                    <Text style={{ fontSize: font.xs, fontWeight: '700', color: statusColor }}>
                      {t(STATUS_LABEL_KEY[item.status])}
                    </Text>
                  </View>
                </View>
                {isAgronomist && (
                  <Body muted style={{ fontSize: font.sm, marginTop: 4 }}>
                    {t('question.from', { name: item.farmerName })}
                  </Body>
                )}
                <Text style={{ color: colors.inkFaint, fontSize: font.xs, marginTop: 6 }}>{formatDate(item.createdAt)}</Text>
              </View>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}
