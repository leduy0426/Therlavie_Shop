import { axiosClient } from './axiosClient';

export const userApi = {
  // UC-37: Get Profile
  getProfile: () => axiosClient.get('/users/profile'),

  // UC-37: Update Profile
  updateProfile: (data: {
    fullName?: string;
    phoneNumber?: string;
    preferredFit?: string;
    favoriteColor?: string;
    heightCm?: number;
    weightKg?: number;
  }) => axiosClient.put('/users/profile', data),

  // UC-37: Upload Avatar (max 3MB)
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosClient.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // UC-37 Alt flow: Remove Avatar
  removeAvatar: () => axiosClient.delete('/users/avatar'),
};
