import api from './api';
import type { WorkReport, PagedResult } from '../types';

export const workReportApi = {
  getPaged: (pageIndex: number, pageSize: number, status?: number) =>
    api.get<PagedResult<WorkReport>>('/workreport', {
      params: { pageIndex, pageSize, status },
    }).then((res) => res.data),

  getById: (id: string) =>
    api.get<WorkReport>(`/workreport/${id}`).then((res) => res.data),

  getByStatus: (status: number) =>
    api.get<WorkReport[]>(`/workreport/status/${status}`).then((res) => res.data),

  create: (data: {
    workOrderId: string;
    operatorId: string;
    equipmentId: string;
    shiftId: string;
    completedQuantity: number;
    defectiveQuantity: number;
    workHours: number;
    remarks?: string;
  }) => api.post<WorkReport>('/workreport', data).then((res) => res.data),

  audit: (data: { reportId: string; reviewerId: string; isApproved: boolean; comment?: string }) =>
    api.post<WorkReport>('/workreport/audit', data).then((res) => res.data),
};
