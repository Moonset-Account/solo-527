import api from './api';
import { CustomerRequirement, RequirementStatus } from '../types';

export const requirementService = {
  getAll: (params?: {
    status?: RequirementStatus;
    keyword?: string;
    destination?: string;
    assignedToId?: string;
    page?: number;
    limit?: number;
  }) => api.get('/requirements', { params }),

  getById: (id: string) => api.get<CustomerRequirement>(`/requirements/${id}`),

  create: (data: Partial<CustomerRequirement>) =>
    api.post<CustomerRequirement>('/requirements', data),

  update: (id: string, data: Partial<CustomerRequirement>) =>
    api.put<CustomerRequirement>(`/requirements/${id}`, data),

  submit: (id: string) =>
    api.post<CustomerRequirement>(`/requirements/${id}/submit`),

  assign: (id: string, assignedToId: string) =>
    api.post<CustomerRequirement>(`/requirements/${id}/assign`, { assignedToId }),

  updateStatus: (id: string, status: RequirementStatus, comments?: string) =>
    api.post<CustomerRequirement>(`/requirements/${id}/status`, { status, comments }),
};
