import { api } from '@/shared/services/api/api';
import type { Question } from '@/shared/types/api.types';

function toFormData(body: { title: string; body?: string; scanId?: number; imageUri?: string }): FormData {
  const form = new FormData();
  form.append('title', body.title);
  if (body.body) form.append('body', body.body);
  if (body.scanId != null) form.append('scanId', String(body.scanId));
  if (body.imageUri) {
    const name = body.imageUri.split('/').pop() ?? 'question.jpg';
    form.append('image', { uri: body.imageUri, name, type: 'image/jpeg' } as unknown as Blob);
  }
  return form;
}

export const questionApi = {
  list: () => api.get<Question[]>('/api/questions').then((r) => r.data),
  get: (id: number) => api.get<Question>(`/api/questions/${id}`).then((r) => r.data),
  create: (body: { title: string; body?: string; scanId?: number; imageUri?: string }) =>
    api
      .post<Question>('/api/questions', toFormData(body), { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data),
  update: (id: number, body: { title: string; body?: string; imageUri?: string }) =>
    api
      .patch<Question>(`/api/questions/${id}`, toFormData(body), { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data),
  remove: (id: number) => api.delete(`/api/questions/${id}`).then(() => undefined),
  answer: (id: number, body: { body: string; attachmentUrl?: string }) =>
    api.post<Question>(`/api/questions/${id}/answers`, body).then((r) => r.data),
  updateAnswer: (questionId: number, answerId: number, body: { body: string; attachmentUrl?: string }) =>
    api.patch<Question>(`/api/questions/${questionId}/answers/${answerId}`, body).then((r) => r.data),
  deleteAnswer: (questionId: number, answerId: number) =>
    api.delete<Question>(`/api/questions/${questionId}/answers/${answerId}`).then((r) => r.data),
};
