import api from './api';
import type { AdjustmentRecord, MoldRecord, QCResult, OperationLog } from '../types';

export const reviewApi = {
  getAdjustmentHistory: (entityType: string, entityId: string) =>
    api.get<AdjustmentRecord[]>(`/review/adjustments/${entityType}/${entityId}`).then((res) => res.data),

  getMoldHistory: (moldId: string) =>
    api.get<MoldRecord[]>(`/review/mold/${moldId}/history`).then((res) => res.data),

  getQCHistory: (workOrderId: string) =>
    api.get<QCResult[]>(`/review/qc/workorder/${workOrderId}`).then((res) => res.data),

  getOperationLogs: (startDate: string, endDate: string, module?: string) =>
    api.get<OperationLog[]>('/review/operation-logs', {
      params: { startDate, endDate, module },
    }).then((res) => res.data),
};
