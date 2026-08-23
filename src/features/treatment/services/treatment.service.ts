import { api } from '@/shared/services/api/api';
import type { Treatment } from '@/shared/types/api.types';

export const treatmentApi = {
  list: (cropId: number) => api.get<Treatment[]>(`/api/crops/${cropId}/treatments`).then((r) => r.data),
  create: (cropId: number, body: Partial<Treatment>) =>
    api.post<Treatment>(`/api/crops/${cropId}/treatments`, body).then((r) => r.data),
  remove: (id: number) => api.delete(`/api/treatments/${id}`).then(() => undefined),
};
