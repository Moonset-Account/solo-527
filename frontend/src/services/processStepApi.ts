import api from './api';
import type { ProcessStepInstance } from '../types';

export const processStepApi = {
  getByQrCode: (qrCode: string) =>
    api.get<ProcessStepInstance>(`/processstep/qrcode/${qrCode}`).then((res) => res.data),

  getByWorkOrder: (workOrderId: string) =>
    api.get<ProcessStepInstance[]>(`/processstep/workorder/${workOrderId}`).then((res) => res.data),

  getById: (id: string) =>
    api.get<ProcessStepInstance>(`/processstep/${id}`).then((res) => res.data),

  scanStart: (data: { qrCode: string; operatorId: string; equipmentId: string }) =>
    api.post<ProcessStepInstance>('/processstep/scan/start', data).then((res) => res.data),

  scanComplete: (data: { qrCode: string; outputQuantity: number; defectiveQuantity: number; remark?: string }) =>
    api.post<ProcessStepInstance>('/processstep/scan/complete', data).then((res) => res.data),

  reportAbnormal: (data: { qrCode: string; reason: string }) =>
    api.post<ProcessStepInstance>('/processstep/abnormal', data).then((res) => res.data),
};
