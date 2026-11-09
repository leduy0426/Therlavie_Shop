/*
    SE1990_NJ
    V1.0-11/09/2026
    Lê Duy - HE194188
*/

import { axiosClient } from './axiosClient';

export const authApi = {
  // UC-31: Register
  register: (data: { fullName: string; email: string; password: string; confirmPassword: string }) =>
    axiosClient.post('/auth/register', data),

  // UC-32: Verify Email OTP
  verifyEmail: (data: { email: string; otpCode: string; guestSessionId?: string }) =>
    axiosClient.post<{ message: string; accessToken: string; user: any }>('/auth/verify-email', data),

  // UC-33: Login
  login: (data: { email: string; password: string; rememberMe?: boolean; guestSessionId?: string }) =>
    axiosClient.post<{ message: string; accessToken: string; user: any; redirectPath: string }>('/auth/login', data),

  // UC-34: Logout
  logout: () => axiosClient.post('/auth/logout'),

  // UC-35: Forgot Password
  forgotPassword: (email: string) => axiosClient.post('/auth/forgot-password', { email }),

  // UC-35: Reset Password
  resetPassword: (data: { email: string; otpCode: string; newPassword: string; confirmPassword: string }) =>
    axiosClient.post('/auth/reset-password', data),

  // UC-36: Change Password
  changePassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    axiosClient.put('/auth/change-password', data),
};

