import { api } from '@/shared/services/api/api';
import type { Crop } from '@/shared/types/api.types';

export const cropApi = {
  update: (id: number, body: Partial<Crop>) =>
    api.patch<Crop>(`/api/crops/${id}`, body).then((r) => r.data),
  remove: (id: number) => api.delete(`/api/crops/${id}`).then(() => undefined),
};
