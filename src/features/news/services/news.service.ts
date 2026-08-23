import { api } from '@/shared/services/api/api';
import type { News } from '@/shared/types/api.types';

export const newsApi = {
  list: () => api.get<News[]>('/api/news').then((r) => r.data),
};
