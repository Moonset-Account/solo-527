import api from './api';
import { Quote, QuoteStatus, ProfitWarningLevel } from '../types';

export const quoteService = {
  getAll: (params?: {
    status?: QuoteStatus;
    requirementId?: string;
    profitWarning?: ProfitWarningLevel;
    page?: number;
    limit?: number;
  }) => api.get('/quotes', { params }),

  getById: (id: string) => api.get<Quote>(`/quotes/${id}`),

  create: (requirementId: string, templateId?: string) =>
    api.post<Quote>('/quotes', { requirementId, templateId }),

  update: (id: string, data: Partial<Quote>, changeDescription?: string) =>
    api.put<Quote>(`/quotes/${id}`, { ...data, changeDescription }),

  submitForApproval: (id: string) =>
    api.post<Quote>(`/quotes/${id}/submit`),

  approve: (id: string, comments?: string) =>
    api.post<Quote>(`/quotes/${id}/approve`, { comments }),

  reject: (id: string, comments: string) =>
    api.post<Quote>(`/quotes/${id}/reject`, { comments }),

  sendToCustomer: (id: string) =>
    api.post<Quote>(`/quotes/${id}/send`),

  customerResponse: (id: string, accepted: boolean) =>
    api.post<Quote>(`/quotes/${id}/response`, { accepted }),

  createNewVersion: (id: string, changeDescription: string) =>
    api.post<Quote>(`/quotes/${id}/version`, { changeDescription }),

  getVersions: (id: string) => api.get(`/quotes/${id}/versions`),

  compareVersions: (id: string, v1: number, v2: number) =>
    api.get(`/quotes/${id}/compare`, { params: { v1, v2 } }),
};
