import { api } from '@/shared/services/api/api';
import type { Page, Scan } from '@/shared/types/api.types';

export const scanApi = {
  scan: (params: {
    imageUri: string;
    farmId?: number;
    cropId?: number;
    latitude?: number;
    longitude?: number;
  }) => {
    const form = new FormData();
    const name = params.imageUri.split('/').pop() ?? 'leaf.jpg';
    form.append('image', { uri: params.imageUri, name, type: 'image/jpeg' } as unknown as Blob);
    if (params.farmId != null) form.append('farmId', String(params.farmId));
    if (params.cropId != null) form.append('cropId', String(params.cropId));
    if (params.latitude != null) form.append('latitude', String(params.latitude));
    if (params.longitude != null) form.append('longitude', String(params.longitude));
    return api
      .post<Scan>('/api/scans', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data);
  },

  guestScan: (imageUri: string) => {
    const form = new FormData();
    const name = imageUri.split('/').pop() ?? 'leaf.jpg';
    form.append('image', { uri: imageUri, name, type: 'image/jpeg' } as unknown as Blob);
    return api
      .post<Scan>('/api/scans/guest', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data);
  },
  history: (disease?: string, page = 0, size = 20) =>
    api
      .get<Page<Scan>>('/api/scans', { params: { disease, page, size } })
      .then((r) => r.data),
  get: (id: number) => api.get<Scan>(`/api/scans/${id}`).then((r) => r.data),
};
