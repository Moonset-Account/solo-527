import apiClient from './client';
import { Appointment, PaginatedResponse, Attachment, AuditLog } from '../types';

export const appointmentsApi = {
  list: (params?: any) => 
    apiClient.get<PaginatedResponse<Appointment>>('/appointments', { params }),
  create: (data: any) => apiClient.post<Appointment>('/appointments', data),
  get: (id: number) => apiClient.get<Appointment>(`/appointments/${id}`),
  updateStatus: (id: number, status: string, cancellation_reason?: string) => 
    apiClient.put(`/appointments/${id}/status`, { status, cancellation_reason }),
  join: (id: number) => apiClient.post(`/appointments/${id}/join`),
  getAttachments: (id: number) => 
    apiClient.get<Attachment[]>(`/appointments/${id}/attachments`),
  uploadAttachment: (id: number, formData: FormData) => 
    apiClient.post(`/appointments/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getHistory: (id: number) => 
    apiClient.get<AuditLog[]>(`/appointments/${id}/history`),
  offlineSync: (data: any) => apiClient.post('/appointments/offline-sync', data),
};
