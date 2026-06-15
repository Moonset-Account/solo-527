import api from './api'
import type {
  KnowledgeBase,
  KnowledgeBaseQuery,
  PagedResult,
  KnowledgeReviewRecord,
  KnowledgeStatistics,
  ApiResponse
} from '@/types'

export const knowledgeService = {
  getKnowledgeBases: (params: KnowledgeBaseQuery): Promise<ApiResponse<PagedResult<KnowledgeBase>>> => {
    return api.get('/knowledgeBase', { params })
  },

  getKnowledgeBase: (id: number): Promise<ApiResponse<KnowledgeBase>> => {
    return api.get(`/knowledgeBase/${id}`)
  },

  createKnowledgeBase: (data: any): Promise<ApiResponse<KnowledgeBase>> => {
    return api.post('/knowledgeBase', data)
  },

  updateKnowledgeBase: (data: any): Promise<ApiResponse<KnowledgeBase>> => {
    return api.put('/knowledgeBase', data)
  },

  deleteKnowledgeBase: (id: number): Promise<ApiResponse<boolean>> => {
    return api.delete(`/knowledgeBase/${id}`)
  },

  addReview: (data: any): Promise<ApiResponse<KnowledgeReviewRecord>> => {
    return api.post('/knowledgeBase/review', data)
  },

  getReviews: (knowledgeBaseId: number): Promise<ApiResponse<KnowledgeReviewRecord[]>> => {
    return api.get(`/knowledgeBase/${knowledgeBaseId}/reviews`)
  },

  getStatistics: (): Promise<ApiResponse<KnowledgeStatistics>> => {
    return api.get('/knowledgeBase/statistics')
  },

  getExpiringSoon: (daysAhead?: number): Promise<ApiResponse<KnowledgeBase[]>> => {
    return api.get('/knowledgeBase/expiring-soon', { params: { daysAhead } })
  },

  markAsUsed: (id: number, isHelpful: boolean): Promise<ApiResponse<boolean>> => {
    return api.post(`/knowledgeBase/${id}/use`, isHelpful)
  }
}
