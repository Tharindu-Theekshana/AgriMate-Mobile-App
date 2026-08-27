import { api } from '@/shared/services/api/api';
import type { User } from '@/shared/types/api.types';

export const agronomistApi = {
  uploadProof: (imageUri: string) => {
    const form = new FormData();
    const name = imageUri.split('/').pop() ?? 'proof.jpg';
    form.append('image', { uri: imageUri, name, type: 'image/jpeg' } as unknown as Blob);
    return api
      .post<User>('/api/users/me/agronomist-proof', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data);
  },
};
