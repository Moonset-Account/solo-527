import api from './api';
import type { Equipment, EquipmentStatistics } from '../types';

export const equipmentApi = {
  getAll: () => api.get<Equipment[]>('/equipment').then((res) => res.data),

  getById: (id: string) =>
    api.get<Equipment>(`/equipment/${id}`).then((res) => res.data),

  getByStatus: (status: number) =>
    api.get<Equipment[]>(`/equipment/status/${status}`).then((res) => res.data),

  create: (data: { code: string; name: string; model: string; location: string }) =>
    api.post<Equipment>('/equipment', data).then((res) => res.data),

  updateStatus: (id: string, status: number, reason?: string) =>
    api.put(`/equipment/${id}/status`, { status, reason }).then((res) => res.data),

  getStatistics: (id: string, startDate: string, endDate: string) =>
    api.get<EquipmentStatistics>(`/equipment/${id}/statistics`, {
      params: { startDate, endDate },
    }).then((res) => res.data),
};
