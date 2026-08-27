import { api } from '@/shared/services/api/api';
import type { AuthResponse, User } from '@/shared/types/api.types';

export const authApi = {
  register: (body: {
    username: string;
    email: string;
    password: string;
    name: string;
    phone?: string;
    location?: string;
    role?: 'FARMER' | 'AGRONOMIST';
    proofImageUri?: string;
  }) => {
    const form = new FormData();
    form.append('username', body.username);
    form.append('email', body.email);
    form.append('password', body.password);
    form.append('name', body.name);
    if (body.phone) form.append('phone', body.phone);
    if (body.location) form.append('location', body.location);
    if (body.role) form.append('role', body.role);
    if (body.proofImageUri) {
      const name = body.proofImageUri.split('/').pop() ?? 'proof.jpg';
      form.append('proofImage', { uri: body.proofImageUri, name, type: 'image/jpeg' } as unknown as Blob);
    }
    return api
      .post<AuthResponse>('/api/auth/register', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data);
  },

  login: (identifier: string, password: string) =>
    api.post<AuthResponse>('/api/auth/login', { identifier, password }).then((r) => r.data),
};

export const userApi = {
  me: () => api.get<User>('/api/users/me').then((r) => r.data),
  update: (body: Partial<Pick<User, 'name' | 'location' | 'profilePhotoUrl'>>) =>
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
