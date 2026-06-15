import api from './api'
import type {
  QualityInspection,
  InspectionQuery,
  PagedResult,
  InspectionStatistics,
  InspectionTemplate,
  ApiResponse
} from '@/types'

export const inspectionService = {
  getInspections: (params: InspectionQuery): Promise<ApiResponse<PagedResult<QualityInspection>>> => {
    return api.get('/qualityInspections', { params })
  },

  getInspection: (id: number): Promise<ApiResponse<QualityInspection>> => {
    return api.get(`/qualityInspections/${id}`)
  },

  createInspection: (data: any): Promise<ApiResponse<QualityInspection>> => {
    return api.post('/qualityInspections', data)
  },

  updateInspection: (data: any): Promise<ApiResponse<QualityInspection>> => {
    return api.put('/qualityInspections', data)
  },

  completeInspection: (id: number, inspectorId: number): Promise<ApiResponse<boolean>> => {
    return api.post(`/qualityInspections/${id}/complete`, inspectorId)
  },

  getStatistics: (departmentId?: number, agentId?: number, startTime?: string, endTime?: string): Promise<ApiResponse<InspectionStatistics>> => {
    return api.get('/qualityInspections/statistics', {
      params: { departmentId, agentId, startTime, endTime }
    })
  },

  getTemplates: (): Promise<ApiResponse<InspectionTemplate[]>> => {
    return api.get('/qualityInspections/templates')
  },

  getTemplate: (id: number): Promise<ApiResponse<InspectionTemplate>> => {
    return api.get(`/qualityInspections/templates/${id}`)
  }
}
