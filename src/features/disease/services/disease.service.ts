import { api } from '@/shared/services/api/api';
import type { Disease } from '@/shared/types/api.types';

export const diseaseApi = {
  list: () => api.get<Disease[]>('/api/diseases').then((r) => r.data),
  get: (key: string) => api.get<Disease>(`/api/diseases/${key}`).then((r) => r.data),
};
