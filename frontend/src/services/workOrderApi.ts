import api from './api';
import type { WorkOrder } from '../types';

export const workOrderApi = {
  getAll: () => api.get<WorkOrder[]>('/workorder').then((res) => res.data),

  getById: (id: string) =>
    api.get<WorkOrder>(`/workorder/${id}`).then((res) => res.data),

  create: (data: WorkOrder) =>
    api.post<WorkOrder>('/workorder', data).then((res) => res.data),

  update: (id: string, data: WorkOrder) =>
    api.put(`/workorder/${id}`, data).then((res) => res.data),
};
