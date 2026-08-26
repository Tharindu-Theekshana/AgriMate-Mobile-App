import { api } from '@/shared/services/api/api';
import type { AppNotification } from '@/shared/types/api.types';

export const notificationApi = {
  list: () => api.get<AppNotification[]>('/api/notifications').then((r) => r.data),
  markAllRead: () => api.post('/api/notifications/read-all').then(() => undefined),
};
