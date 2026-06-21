import api from './api';
import type { DowntimeRecord } from '../types';

export const downtimeApi = {
  getById: (id: string) =>
    api.get<DowntimeRecord>(`/downtime/${id}`).then((res) => res.data),

  getByEquipment: (equipmentId: string, startDate: string, endDate: string) =>
    api.get<DowntimeRecord[]>(`/downtime/equipment/${equipmentId}`, {
      params: { startDate, endDate },
    }).then((res) => res.data),

  start: (data: {
    equipmentId: string;
    reason: number;
    reasonDetail?: string;
    reporterId: string;
    shiftId?: string;
  }) => api.post<DowntimeRecord>('/downtime/start', data).then((res) => res.data),

  end: (id: string) =>
    api.post<DowntimeRecord>(`/downtime/${id}/end`).then((res) => res.data),
};
