/*
    SE1990_NJ
    V1.0-11/09/2026
    Lê Duy - HE194188
*/

import { axiosClient } from './axiosClient';

export const adminApi = {
  // UC-40: List users with pagination and search
  getUsers: (params?: { page?: number; limit?: number; search?: string; role?: string; status?: string }) =>
    axiosClient.get('/admin/users', { params }),

  // UC-40: Modify role or lock/unlock account
  updateUser: (userId: number, data: { newRole?: string; newStatus?: string; justificationReason?: string }) =>
    axiosClient.patch(`/admin/users/${userId}`, data),

  // UC-40: View Audit Logs
  getAuditLogs: (page = 1, limit = 20) =>
    axiosClient.get('/admin/users/audit-logs', { params: { page, limit } }),
};

