import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { Body, Button, FormError, Screen, TextField, Title } from '@/shared/components/ui';
import { useToast } from '@/shared/providers/ToastProvider';
import { apiErrorMessage } from '@/shared/services/api/api';
import { radius, spacing } from '@/shared/theme/theme';
import { resolveImageUrl } from '@/shared/utils/format';

import { useColors } from '@/features/theme';
import type { MainStackParamList } from '@/navigation/types';
import { questionApi } from '../services/question.service';

type Props = NativeStackScreenProps<MainStackParamList, 'AskQuestion'>;

export default function AskQuestionScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const colors = useColors();
  const toast = useToast();
  const editing = route.params?.editQuestion;
  const [title, setTitle] = useState(editing?.title ?? route.params?.title ?? '');
  const [body, setBody] = useState(editing?.body ?? '');
  const [existingImageUrl] = useState(editing?.imageUrl ?? null);
  const [newImageUri, setNewImageUri] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: editing ? t('question.editTitle') : t('question.askTitle') });
  }, [navigation, t, editing]);

  async function pickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.error(t('common.error'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true, aspect: [4, 3] });
    if (!result.canceled && result.assets[0]) setNewImageUri(result.assets[0].uri);
  }

  async function submit() {
    if (!title.trim()) {
      setError(t('question.titleRequired'));
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      if (editing) {
        await questionApi.update(editing.id, {
          title: title.trim(),
          body: body.trim() || undefined,
          imageUri: newImageUri ?? undefined,
        });
        toast.success(t('question.updated'));
        navigation.goBack();
      } else {
        const q = await questionApi.create({
          title: title.trim(),
          body: body.trim() || undefined,
          imageUri: newImageUri ?? undefined,
          scanId: route.params?.scanId,
        });
        toast.success(t('question.submitted'));
        navigation.replace('QuestionDetail', { questionId: q.id });
      }
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  const previewUri = newImageUri ?? resolveImageUrl(existingImageUrl ?? undefined);

  return (
    <Screen scroll>
      <Title style={{ marginBottom: spacing.lg }}>{editing ? t('question.editTitle') : t('question.askTitle')}</Title>

      <TextField
        label={t('question.questionTitle')}
        placeholder={t('question.questionTitlePlaceholder')}
        value={title}
        onChangeText={setTitle}
      />
      <TextField
        label={`${t('question.questionBody')} (${t('common.optional')})`}
        value={body}
        onChangeText={setBody}
        multiline
        numberOfLines={4}
        style={{ minHeight: 100, paddingTop: spacing.md, textAlignVertical: 'top' }}
      />

      <Body muted style={{ fontSize: 13, marginBottom: spacing.xs }}>
        {`${t('question.attachPhoto')} (${t('common.optional')})`}
      </Body>
      <Pressable
        onPress={pickImage}
        style={{
          height: 140,
          borderRadius: radius.lg,
          borderWidth: 2,
          borderColor: colors.border,
          borderStyle: 'dashed',
          backgroundColor: colors.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          marginBottom: spacing.lg,
        }}>
        {previewUri ? (
          <Image source={{ uri: previewUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <Ionicons name="camera-outline" size={32} color={colors.inkFaint} />
        )}
      </Pressable>

      <FormError message={error} />
      <Button title={editing ? t('common.save') : t('question.submit')} onPress={submit} loading={submitting} />
    </Screen>
  );
}
