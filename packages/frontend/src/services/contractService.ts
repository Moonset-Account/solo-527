import api from './api';
import { Contract, ContractStatus } from '../types';

export const contractService = {
  getAll: (params?: {
    status?: ContractStatus;
    quoteId?: string;
    customerName?: string;
    page?: number;
    limit?: number;
  }) => api.get('/contracts', { params }),

  getById: (id: string) => api.get<Contract>(`/contracts/${id}`),

  create: (quoteId: string) =>
    api.post<Contract>('/contracts', { quoteId }),

  update: (id: string, data: Partial<Contract>) =>
    api.put<Contract>(`/contracts/${id}`, data),

  submitForApproval: (id: string) =>
    api.post<Contract>(`/contracts/${id}/submit`),

  approve: (id: string, comments?: string) =>
    api.post<Contract>(`/contracts/${id}/approve`, { comments }),

  reject: (id: string, comments: string) =>
    api.post<Contract>(`/contracts/${id}/reject`, { comments }),

  markSigned: (id: string, signedAt: string) =>
    api.post<Contract>(`/contracts/${id}/sign`, { signedAt }),

  cancel: (id: string, reason: string) =>
    api.post<Contract>(`/contracts/${id}/cancel`, { reason }),

  getAuditLogs: (id: string) => api.get(`/contracts/${id}/audit-logs`),
};
