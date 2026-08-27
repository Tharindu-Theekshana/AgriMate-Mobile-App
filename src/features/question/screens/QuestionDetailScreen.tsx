import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useCallback, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { useAppSelector } from '@/app/hooks';
import { Avatar, Body, Button, Card, EmptyState, Loading, Screen, TextField, Title } from '@/shared/components/ui';
import { useToast } from '@/shared/providers/ToastProvider';
import { apiErrorMessage } from '@/shared/services/api/api';
import { font, spacing } from '@/shared/theme/theme';
import type { Answer, Question } from '@/shared/types/api.types';
import { formatDate, resolveImageUrl } from '@/shared/utils/format';

import { selectUser } from '@/features/auth/store/auth.selectors';
import { useColors } from '@/features/theme';
import type { MainStackParamList } from '@/navigation/types';
import { questionApi } from '../services/question.service';

type Props = NativeStackScreenProps<MainStackParamList, 'QuestionDetail'>;

export default function QuestionDetailScreen({ route, navigation }: Props) {
  const { questionId } = route.params;
  const { t } = useTranslation();
  const colors = useColors();
  const toast = useToast();
  const user = useAppSelector(selectUser);
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingAnswerId, setEditingAnswerId] = useState<number | null>(null);
  const [editAnswerBody, setEditAnswerBody] = useState('');
  const [answerBusy, setAnswerBusy] = useState<number | null>(null);

  const load = useCallback(() => {
    questionApi
      .get(questionId)
      .then(setQuestion)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [questionId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const canAnswer =
    user?.role === 'AGRONOMIST' && user.agronomistStatus === 'APPROVED' && question?.status !== 'CLOSED';

  const canEditQuestion = user?.role === 'FARMER' && question?.status === 'OPEN';
  const canDeleteQuestion = user?.role === 'FARMER';

  async function deleteQuestion() {
    if (!question) return;
    const confirmed = await toast.confirm(t('question.deleteConfirm'), {
      title: t('common.delete'),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await questionApi.remove(question.id);
      toast.success(t('question.deleted'));
      navigation.goBack();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  useLayoutEffect(() => {
    if (!canEditQuestion && !canDeleteQuestion) {
      navigation.setOptions({ headerRight: undefined });
      return;
    }
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 16 }}>
          {canEditQuestion && question && (
            <Pressable
              onPress={() =>
                navigation.navigate('AskQuestion', {
                  editQuestion: { id: question.id, title: question.title, body: question.body, imageUrl: question.imageUrl },
                })
              }
              hitSlop={10}>
              <Ionicons name="pencil" size={22} color={colors.ink} />
            </Pressable>
          )}
          {canDeleteQuestion && (
            <Pressable onPress={deleteQuestion} hitSlop={10}>
              <Ionicons name="trash-outline" size={22} color={colors.danger} />
            </Pressable>
          )}
        </View>
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, canEditQuestion, canDeleteQuestion, question, colors.ink, colors.danger]);

  async function submitAnswer() {
    if (!reply.trim() || !question) return;
    setSubmitting(true);
    try {
      const updated = await questionApi.answer(question.id, { body: reply.trim() });
      setQuestion(updated);
      setReply('');
      toast.success(t('question.answerSubmitted'));
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  function startEditAnswer(a: Answer) {
    setEditingAnswerId(a.id);
    setEditAnswerBody(a.body);
  }

  async function saveEditAnswer() {
    if (!question || editingAnswerId == null || !editAnswerBody.trim()) return;
    setAnswerBusy(editingAnswerId);
    try {
      const updated = await questionApi.updateAnswer(question.id, editingAnswerId, { body: editAnswerBody.trim() });
      setQuestion(updated);
      setEditingAnswerId(null);
      toast.success(t('question.answerUpdated'));
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setAnswerBusy(null);
    }
  }

  async function deleteAnswer(a: Answer) {
    if (!question) return;
    const confirmed = await toast.confirm(t('question.deleteAnswerConfirm'), {
      title: t('common.delete'),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      destructive: true,
    });
    if (!confirmed) return;
    setAnswerBusy(a.id);
    try {
      const updated = await questionApi.deleteAnswer(question.id, a.id);
      setQuestion(updated);
      toast.success(t('question.answerDeleted'));
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setAnswerBusy(null);
    }
  }

  if (loading) return <Loading />;
  if (!question) return <EmptyState icon="alert-circle-outline" text={t('question.loadError')} />;

  return (
    <Screen scroll>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
          <Avatar uri={question.farmerPhotoUrl} name={question.farmerName} size={36} style={{ marginRight: spacing.sm }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700', color: colors.ink }}>{question.farmerName}</Text>
            <Text style={{ fontSize: font.xs, color: colors.inkFaint }}>
              {question.farmerLocation ? `${question.farmerLocation} · ` : ''}
              {formatDate(question.createdAt)}
            </Text>
          </View>
        </View>
        <Title style={{ fontSize: font.xl, marginBottom: spacing.xs }}>{question.title}</Title>
        {question.body ? <Body style={{ marginTop: spacing.md }}>{question.body}</Body> : null}
        {question.imageUrl ? (
          <Image
            source={{ uri: resolveImageUrl(question.imageUrl) }}
            style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 12, marginTop: spacing.md }}
            contentFit="cover"
          />
        ) : null}
      </Card>

      <View style={{ marginTop: spacing.lg }}>
        <Text style={{ fontWeight: '700', color: colors.ink, marginBottom: spacing.sm }}>{t('question.answers')}</Text>
        {question.answers.length === 0 ? (
          <Body muted>{t('question.noAnswersYet')}</Body>
        ) : (
          question.answers.map((a) => {
            const isMine = user?.role === 'AGRONOMIST' && a.agronomistId === user.id;
            const editing = editingAnswerId === a.id;
            return (
              <Card key={a.id} style={{ marginBottom: spacing.sm, backgroundColor: colors.pale, borderColor: colors.accent }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Avatar uri={a.agronomistPhotoUrl} name={a.agronomistName} size={32} style={{ marginRight: spacing.sm }} />
                    <View>
                      <Text style={{ fontWeight: '700', color: colors.primaryDeep }}>{a.agronomistName}</Text>
                      <Text style={{ fontSize: font.xs, color: colors.inkFaint }}>@{a.agronomistUsername}</Text>
                    </View>
                  </View>
                  {isMine && !editing && (
                    <View style={{ flexDirection: 'row', gap: 14 }}>
                      <Pressable onPress={() => startEditAnswer(a)} hitSlop={8}>
                        <Ionicons name="pencil" size={16} color={colors.primaryDeep} />
                      </Pressable>
                      <Pressable onPress={() => deleteAnswer(a)} hitSlop={8}>
                        <Ionicons name="trash-outline" size={16} color={colors.danger} />
                      </Pressable>
                    </View>
                  )}
                </View>

                {editing ? (
                  <>
                    <TextField
                      value={editAnswerBody}
                      onChangeText={setEditAnswerBody}
                      multiline
                      numberOfLines={3}
                      style={{ minHeight: 80, paddingTop: spacing.sm, textAlignVertical: 'top' }}
                    />
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                      <Button
                        title={t('common.save')}
                        onPress={saveEditAnswer}
                        loading={answerBusy === a.id}
                        disabled={!editAnswerBody.trim()}
                        style={{ flex: 1 }}
                      />
                      <Button
                        title={t('common.cancel')}
                        variant="secondary"
                        onPress={() => setEditingAnswerId(null)}
                        style={{ flex: 1 }}
                      />
                    </View>
                  </>
                ) : (
                  <>
                    <Body style={{ fontSize: font.sm }}>{a.body}</Body>
                    <Text style={{ color: colors.inkFaint, fontSize: font.xs, marginTop: 6 }}>{formatDate(a.createdAt)}</Text>
                  </>
                )}
              </Card>
            );
          })
        )}
      </View>

      {canAnswer && (
        <View style={{ marginTop: spacing.lg }}>
          <TextField
            label={t('question.writeAnswer')}
            placeholder={t('question.answerPlaceholder')}
            value={reply}
            onChangeText={setReply}
            multiline
            numberOfLines={4}
            style={{ minHeight: 100, paddingTop: spacing.md, textAlignVertical: 'top' }}
          />
          <Button title={t('question.submitAnswer')} onPress={submitAnswer} loading={submitting} disabled={!reply.trim()} />
        </View>
      )}
    </Screen>
  );
}
