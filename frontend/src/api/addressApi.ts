/*
    SE1990_NJ
    V1.0-11/09/2026
    Lê Duy - HE194188
*/

import { axiosClient } from './axiosClient';

export const addressApi = {
  // UC-38: Get Addresses
  getAddresses: () => axiosClient.get('/addresses'),

  // UC-38: Create Address (max 5 - BR-14)
  createAddress: (data: {
    recipientName: string;
    phoneNumber: string;
    provinceCity: string;
    district: string;
    ward: string;
    detailedAddress: string;
    isDefault?: boolean;
  }) => axiosClient.post('/addresses', data),

  // UC-38: Update Address
  updateAddress: (id: number, data: any) => axiosClient.put(`/addresses/${id}`, data),

  // UC-38 Alt Flow 1.2: Set Default
  setDefault: (id: number) => axiosClient.patch(`/addresses/${id}/default`),

  // UC-38 Alt Flow 1.1: Delete Address
  deleteAddress: (id: number) => axiosClient.delete(`/addresses/${id}`),
};

