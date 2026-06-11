import api, { ApiResponse, PaginatedResponse } from '../utils/api';

export interface RecruitmentCycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  description?: string;
  milestones?: { name: string; date: string; description: string }[];
  resumeCount: number;
  hireCount: number;
  createdAt: string;
}

export interface ProcessingRecord {
  id: string;
  resumeId: string;
  candidateName: string;
  actionType: string;
  actionDetail?: string;
  operatorId: string;
  operatorName: string;
  remarks?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export const recruitmentApi = {
  createCycle: (data: any): Promise<ApiResponse<RecruitmentCycle>> =>
    api.post('/recruitment/cycles', data),

  getCycles: (status?: string): Promise<ApiResponse<RecruitmentCycle[]>> =>
    api.get('/recruitment/cycles', { params: { status } }),

  getCycleById: (id: string): Promise<ApiResponse<RecruitmentCycle>> =>
    api.get(`/recruitment/cycles/${id}`),

  updateCycle: (id: string, data: any): Promise<ApiResponse<RecruitmentCycle>> =>
    api.put(`/recruitment/cycles/${id}`, data),

  getProcessingRecords: (params?: {
    resumeId?: string;
    actionType?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<PaginatedResponse<ProcessingRecord>>> =>
    api.get('/recruitment/records', { params }),
};
