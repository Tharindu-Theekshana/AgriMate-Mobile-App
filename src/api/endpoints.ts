import { api } from './client';
import type {
  AppNotification,
  AuthResponse,
  Crop,
  Disease,
  Farm,
  News,
  Page,
  Question,
  Scan,
  Treatment,
  User,
} from './types';

// ---- Auth ----
export const authApi = {
  register: (body: {
    username: string;
    email: string;
    password: string;
    name: string;
    phone?: string;
    language?: string;
    location?: string;
    role?: 'FARMER' | 'AGRONOMIST';
  }) => api.post<AuthResponse>('/api/auth/register', body).then((r) => r.data),

  // identifier = username OR email
  login: (identifier: string, password: string) =>
    api.post<AuthResponse>('/api/auth/login', { identifier, password }).then((r) => r.data),
};

// ---- User ----
export const userApi = {
  me: () => api.get<User>('/api/users/me').then((r) => r.data),
  update: (body: Partial<Pick<User, 'name' | 'language' | 'location' | 'profilePhotoUrl'>>) =>
    api.patch<User>('/api/users/me', body).then((r) => r.data),
  uploadPhoto: (imageUri: string) => {
    const form = new FormData();
    const name = imageUri.split('/').pop() ?? 'avatar.jpg';
    form.append('image', { uri: imageUri, name, type: 'image/jpeg' } as unknown as Blob);
    return api
      .post<User>('/api/users/me/photo', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data);
  },
};

// ---- News (public feed; admin-managed) ----
export const newsApi = {
  list: () => api.get<News[]>('/api/news').then((r) => r.data),
};

// ---- In-app notifications (registered users) ----
export const notificationApi = {
  list: () => api.get<AppNotification[]>('/api/notifications').then((r) => r.data),
  markAllRead: () => api.post('/api/notifications/read-all').then(() => undefined),
};

// ---- Farms & crops ----
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

export const cropApi = {
  update: (id: number, body: Partial<Crop>) =>
    api.patch<Crop>(`/api/crops/${id}`, body).then((r) => r.data),
  remove: (id: number) => api.delete(`/api/crops/${id}`).then(() => undefined),
};

// ---- Treatment / fertilizer logs ----
export const treatmentApi = {
  list: (cropId: number) => api.get<Treatment[]>(`/api/crops/${cropId}/treatments`).then((r) => r.data),
  create: (cropId: number, body: Partial<Treatment>) =>
    api.post<Treatment>(`/api/crops/${cropId}/treatments`, body).then((r) => r.data),
  remove: (id: number) => api.delete(`/api/treatments/${id}`).then(() => undefined),
};

// ---- Scans ----
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
    // React Native FormData file shape:
    form.append('image', { uri: params.imageUri, name, type: 'image/jpeg' } as unknown as Blob);
    if (params.farmId != null) form.append('farmId', String(params.farmId));
    if (params.cropId != null) form.append('cropId', String(params.cropId));
    if (params.latitude != null) form.append('latitude', String(params.latitude));
    if (params.longitude != null) form.append('longitude', String(params.longitude));
    return api
      .post<Scan>('/api/scans', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data);
  },
  /** Guest scan: AI diagnosis only, not saved to server history. */
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

// ---- App version / force update ----
export interface VersionCheck {
  updateAvailable: boolean;
  forceUpdate: boolean;
  latestVersion: string;
  currentVersion: string;
}
export const appVersionApi = {
  check: (platform: 'ANDROID' | 'IOS', version: string) =>
    api
      .get<VersionCheck>('/api/app-version/check', { params: { platform, version } })
      .then((r) => r.data),
};

// ---- Disease knowledge base ----
export const diseaseApi = {
  list: () => api.get<Disease[]>('/api/diseases').then((r) => r.data),
  get: (key: string) => api.get<Disease>(`/api/diseases/${key}`).then((r) => r.data),
};

// ---- Q&A ----
export const questionApi = {
  list: () => api.get<Question[]>('/api/questions').then((r) => r.data),
  get: (id: number) => api.get<Question>(`/api/questions/${id}`).then((r) => r.data),
  create: (body: { title: string; body?: string; imageUrl?: string; scanId?: number }) =>
    api.post<Question>('/api/questions', body).then((r) => r.data),
  answer: (id: number, body: { body: string; attachmentUrl?: string }) =>
    api.post<Question>(`/api/questions/${id}/answers`, body).then((r) => r.data),
};
