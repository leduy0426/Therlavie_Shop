import { axiosClient } from './axiosClient';

export const guestApi = {
  // UC-39: Request Guest Checkout OTP
  requestOtp: (phoneNumber: string, email?: string) =>
    axiosClient.post('/guest/checkout-otp/request', { phoneNumber, email }),

  // UC-39: Verify Guest Checkout OTP
  verifyOtp: (phoneNumber: string, otpCode: string) =>
    axiosClient.post<{ verified: boolean; guestVerificationToken: string; expiresInSeconds: number }>(
      '/guest/checkout-otp/verify',
      { phoneNumber, otpCode },
    ),
};

