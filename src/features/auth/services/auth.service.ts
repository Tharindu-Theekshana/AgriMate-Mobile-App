import { api } from '@/shared/services/api/client';
import type { AuthResponse, User } from '@/shared/types/api.types';

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

  login: (identifier: string, password: string) =>
    api.post<AuthResponse>('/api/auth/login', { identifier, password }).then((r) => r.data),
};

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
