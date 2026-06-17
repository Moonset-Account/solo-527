import request from '@/utils/request';
import type {
  Ticket,
  QualityCheck,
  Improvement,
  ServiceTicketFilter,
  CreateQualityCheckData,
  CreateImprovementData,
  UpdateImprovementData,
  PaginatedResponse,
  ApiResponse,
  ExportRequest,
  ExportInfo,
} from '@/types';

export const operationApi = {
  getServiceTickets: async (params?: ServiceTicketFilter): Promise<ApiResponse<PaginatedResponse<Ticket>>> => {
    return request.get('/operations/service-tickets', { params });
  },

  getQualityChecks: async (
    page: number = 1,
    pageSize: number = 10
  ): Promise<ApiResponse<PaginatedResponse<QualityCheck>>> => {
    return request.get('/operations/quality-checks', { params: { page, pageSize } });
  },

  createQualityCheck: async (data: CreateQualityCheckData): Promise<ApiResponse<QualityCheck>> => {
    return request.post('/operations/quality-checks', data);
  },

  getImprovements: async (
    page: number = 1,
    pageSize: number = 10
  ): Promise<ApiResponse<PaginatedResponse<Improvement>>> => {
    return request.get('/operations/improvements', { params: { page, pageSize } });
  },

  createImprovement: async (data: CreateImprovementData): Promise<ApiResponse<Improvement>> => {
    return request.post('/operations/improvements', data);
  },

  updateImprovement: async (id: string, data: UpdateImprovementData): Promise<ApiResponse<Improvement>> => {
    return request.put(`/operations/improvements/${id}`, data);
  },

  checkDuplicateExport: async (params: ExportRequest): Promise<ApiResponse<{ exists: boolean; exportId?: string }>> => {
    return request.post('/operations/exports/check-duplicate', params);
  },

  createExport: async (params: ExportRequest): Promise<ApiResponse<ExportInfo>> => {
    return request.post('/operations/exports', params);
  },

  downloadExport: async (exportId: string): Promise<ApiResponse<{ downloadUrl: string }>> => {
    return request.get(`/operations/exports/${exportId}/download`);
  },
};
