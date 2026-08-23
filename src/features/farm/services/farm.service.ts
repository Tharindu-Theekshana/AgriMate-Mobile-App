import { api } from '@/shared/services/api/api';
import type { Crop, Farm } from '@/shared/types/api.types';

export const farmApi = {
  list: () => api.get<Farm[]>('/api/farms').then((r) => r.data),
  get: (id: number) => api.get<Farm>(`/api/farms/${id}`).then((r) => r.data),
  create: (body: Partial<Farm>) => api.post<Farm>('/api/farms', body).then((r) => r.data),
  update: (id: number, body: Partial<Farm>) =>
    api.patch<Farm>(`/api/farms/${id}`, body).then((r) => r.data),
  remove: (id: number) => api.delete(`/api/farms/${id}`).then(() => undefined),

  crops: (farmId: number) => api.get<Crop[]>(`/api/farms/${farmId}/crops`).then((r) => r.data),
  addCrop: (farmId: number, body: Partial<Crop>) =>
    api.post<Crop>(`/api/farms/${farmId}/crops`, body).then((r) => r.data),
};
