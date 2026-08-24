import { api } from '@/shared/services/api/api';
import type { StageLog } from '@/shared/types/api.types';

export const stageLogApi = {
  list: (cropId: number) => api.get<StageLog[]>(`/api/crops/${cropId}/stages`).then((r) => r.data),
  create: (cropId: number, body: { stageKey: string; reachedDate: string }) =>
    api.post<StageLog>(`/api/crops/${cropId}/stages`, body).then((r) => r.data),
  remove: (id: number) => api.delete(`/api/stages/${id}`).then(() => undefined),
};
