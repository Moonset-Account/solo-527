import request from './request'
import type {
  Conversation,
  ConversationDetail,
  Message,
  SendMessageResponse,
  Prompt,
  PromptCategory,
  Review,
  OverviewStats,
  AccuracyStats,
  DailyStats,
  ErrorStatsResult,
  RiskSample,
  RiskRule,
  DRFPaginationResult,
  ConversationListParams,
  PromptListParams,
  ReviewListParams,
  RiskSampleListParams,
  AccuracyStatsParams,
  DailyStatsParams,
  ErrorStatsParams,
  SalesOperationRankingItem,
  PromptVersionRankingItem,
  ReviewStatsResult,
  RiskStatsResult,
  AISuggestion,
} from '../types/api'

export const conversationApi = {
  getConversations: (params?: ConversationListParams) => {
    return request.get<DRFPaginationResult<Conversation>>('/api/conversations/', { params })
  },

  getConversation: (id: number | string) => {
    return request.get<ConversationDetail>(`/api/conversations/${id}/`)
  },

  createConversation: (data: Partial<Conversation>) => {
    return request.post<Conversation>('/api/conversations/', data)
  },

  sendMessage: (conversationId: number | string, content: string) => {
    return request.post<SendMessageResponse>(`/api/conversations/${conversationId}/send-message/`, { content })
  },

  getAISuggestion: (conversationId: number | string) => {
    return request.get<AISuggestion>(`/api/conversations/${conversationId}/ai-suggestion/`)
  },

  adoptSuggestion: (conversationId: number | string, messageId: number | string) => {
    return request.post<{ message: string; message_id: number }>(
      `/api/conversations/${conversationId}/adopt-suggestion/`,
      { message_id: messageId }
    )
  },

  getMessages: (conversationId: number | string, params?: { page?: number; page_size?: number }) => {
    return request.get<DRFPaginationResult<Message>>(
      `/api/conversations/${conversationId}/messages/`,
      { params }
    )
  },
}

export const promptApi = {
  getPrompts: (params: PromptListParams) => {
    return request.get<DRFPaginationResult<Prompt>>('/api/prompts/', { params })
  },

  getPrompt: (id: number | string) => {
    return request.get<Prompt>(`/api/prompts/${id}/`)
  },

  createPrompt: (data: Partial<Prompt>) => {
    return request.post<Prompt>('/api/prompts/', data)
  },

  updatePrompt: (id: number | string, data: Partial<Prompt>) => {
    return request.put<Prompt>(`/api/prompts/${id}/`, data)
  },

  publishPrompt: (id: number | string) => {
    return request.post<Prompt>(`/api/prompts/${id}/publish/`)
  },

  disablePrompt: (id: number | string) => {
    return request.post<Prompt>(`/api/prompts/${id}/disable/`)
  },

  rollbackPrompt: (id: number | string, versionId: number | string) => {
    return request.post<Prompt>(`/api/prompts/${id}/rollback/`, { version_id: versionId })
  },

  getPromptVersionHistory: (id: number | string) => {
    return request.get<Prompt[]>(`/api/prompts/${id}/versions/`)
  },

  getPromptStats: (id: number | string) => {
    return request.get<{ usage_count: number; accuracy_rate: number }>(`/api/prompts/${id}/stats/`)
  },

  getPromptCategories: () => {
    return request.get<PromptCategory[]>('/api/prompts/categories/')
  },
}

export const reviewApi = {
  getReviews: (params: ReviewListParams) => {
    return request.get<DRFPaginationResult<Review>>('/api/reviews/', { params })
  },

  getReview: (id: number | string) => {
    return request.get<Review>(`/api/reviews/${id}/`)
  },

  approveReview: (id: number | string, payload?: { comment?: string; is_accurate?: boolean; inaccuracy_reason?: string }) => {
    return request.post<Review>(`/api/reviews/${id}/approve/`, payload || {})
  },

  rejectReview: (id: number | string, payload?: { comment?: string; is_accurate?: boolean; inaccuracy_reason?: string }) => {
    return request.post<Review>(`/api/reviews/${id}/reject/`, payload || {})
  },

  flagReview: (id: number | string, payload?: { comment?: string }) => {
    return request.post<Review>(`/api/reviews/${id}/flag/`, payload || {})
  },

  batchApproveReviews: (ids: (number | string)[], comment?: string) => {
    return request.post<{ success: number; failed: number }>('/api/reviews/batch-approve/', { ids, comment })
  },

  batchRejectReviews: (ids: (number | string)[], comment?: string) => {
    return request.post<{ success: number; failed: number }>('/api/reviews/batch-reject/', { ids, comment })
  },

  getPendingReviewCount: () => {
    return request.get<{ count: number }>('/api/reviews/pending-count/')
  },

  getReviewStats: () => {
    return request.get<ReviewStatsResult>('/api/reviews/stats/')
  },
}

export const statsApi = {
  getOverviewStats: (params?: { days?: number }) => {
    return request.get<OverviewStats>('/api/analytics/overview/', { params })
  },

  getAccuracyStats: (params?: AccuracyStatsParams) => {
    return request.get<DRFPaginationResult<AccuracyStats>>('/api/analytics/accuracy-stats/', { params })
  },

  getDailyStats: (params?: DailyStatsParams) => {
    return request.get<DRFPaginationResult<DailyStats>>('/api/analytics/daily-stats/', { params })
  },

  getErrorStats: (params?: ErrorStatsParams) => {
    return request.get<ErrorStatsResult>('/api/analytics/error-stats/', { params })
  },

  getSalesOperationRanking: (params?: { start_date?: string; end_date?: string; limit?: number }) => {
    return request.get<SalesOperationRankingItem[]>('/api/analytics/sales-operation-ranking/', { params })
  },

  getPromptVersionRanking: (params?: { start_date?: string; end_date?: string; limit?: number }) => {
    return request.get<PromptVersionRankingItem[]>('/api/analytics/prompt-version-ranking/', { params })
  },
}

export const riskApi = {
  getRiskSamples: (params: RiskSampleListParams) => {
    return request.get<DRFPaginationResult<RiskSample>>('/api/risks/samples/', { params })
  },

  getRiskSample: (id: number | string) => {
    return request.get<RiskSample>(`/api/risks/samples/${id}/`)
  },

  createRiskSample: (data: Partial<RiskSample>) => {
    return request.post<RiskSample>('/api/risks/samples/', data)
  },

  updateRiskSample: (id: number | string, data: Partial<RiskSample>) => {
    return request.put<RiskSample>(`/api/risks/samples/${id}/`, data)
  },

  confirmRiskSample: (id: number | string, comment?: string) => {
    return request.post<RiskSample>(`/api/risks/samples/${id}/confirm/`, { handle_comment: comment })
  },

  resolveRiskSample: (id: number | string, comment?: string) => {
    return request.post<RiskSample>(`/api/risks/samples/${id}/resolve/`, { handle_comment: comment })
  },

  markFalsePositive: (id: number | string, comment?: string) => {
    return request.post<RiskSample>(`/api/risks/samples/${id}/mark-false-positive/`, { handle_comment: comment })
  },

  batchProcessRiskSamples: (ids: (number | string)[], action: string, comment?: string) => {
    return request.post<{ success: boolean; updated_count: number; message: string }>('/api/risks/samples/batch-process/', {
      ids,
      action,
      handle_comment: comment,
    })
  },

  exportRiskSamples: (params?: RiskSampleListParams) => {
    return request.get<Blob>('/api/risks/samples/export/', { params, responseType: 'blob' })
  },

  getRiskStats: (params?: { start_date?: string; end_date?: string }) => {
    return request.get<RiskStatsResult>('/api/risks/samples/stats/', { params })
  },

  getRiskRules: () => {
    return request.get<RiskRule[]>('/api/risks/rules/')
  },

  createRiskRule: (data: Partial<RiskRule>) => {
    return request.post<RiskRule>('/api/risks/rules/', data)
  },

  updateRiskRule: (id: number | string, data: Partial<RiskRule>) => {
    return request.put<RiskRule>(`/api/risks/rules/${id}/`, data)
  },

  deleteRiskRule: (id: number | string) => {
    return request.delete(`/api/risks/rules/${id}/`)
  },

  toggleRiskRule: (id: number | string) => {
    return request.post<RiskRule>(`/api/risks/rules/${id}/toggle/`)
  },
}

export { request }
