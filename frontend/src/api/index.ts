import request from './request'
import type {
  Conversation,
  ConversationDetail,
  Message,
  Prompt,
  PromptCategory,
  Review,
  OverviewStats,
  AccuracyStats,
  DailyStats,
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
  ReviewItem,
  ReviewQueryParams,
  ReviewStats,
  PageResult,
  PromptItem,
  PromptQueryParams,
  PromptVersionHistory,
  RiskItem,
  RiskQueryParams,
  RiskStats,
  AISuggestion,
} from '../types/api'

// ==================== 会话API ====================

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
    return request.post<Message>(`/api/conversations/${conversationId}/send-message/`, { content })
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

  getMessages: (conversationId: number | string, params?: { page?: number; pageSize?: number }) => {
    return request.get<DRFPaginationResult<Message>>(
      `/api/conversations/${conversationId}/messages/`,
      { params }
    )
  },
}

// ==================== 提示词API ====================

export const promptApi = {
  getPrompts: (params: PromptListParams) => {
    return request.get<DRFPaginationResult<Prompt>>('/api/prompts/', { params })
  },

  getPrompt: (id: string) => {
    return request.get<Prompt>(`/api/prompts/${id}/`)
  },

  createPrompt: (data: Partial<Prompt>) => {
    return request.post<Prompt>('/api/prompts/', data)
  },

  updatePrompt: (id: string, data: Partial<Prompt>) => {
    return request.put<Prompt>(`/api/prompts/${id}/`, data)
  },

  publishPrompt: (id: string) => {
    return request.post<Prompt>(`/api/prompts/${id}/publish/`)
  },

  disablePrompt: (id: string) => {
    return request.post<Prompt>(`/api/prompts/${id}/disable/`)
  },

  rollbackPrompt: (id: string, versionId: string) => {
    return request.post<Prompt>(`/api/prompts/${id}/rollback/`, { version_id: versionId })
  },

  getPromptVersionHistory: (id: string) => {
    return request.get<Prompt[]>(`/api/prompts/${id}/versions/`)
  },

  getPromptStats: (id: string) => {
    return request.get<{ usage_count: number; accuracy_rate: number }>(`/api/prompts/${id}/stats/`)
  },

  getPromptCategories: () => {
    return request.get<PromptCategory[]>('/api/prompt-categories/')
  },
}

// ==================== 审核API ====================

export const reviewApi = {
  getReviews: (params: ReviewListParams) => {
    return request.get<DRFPaginationResult<Review>>('/api/reviews/', { params })
  },

  getReview: (id: string) => {
    return request.get<Review>(`/api/reviews/${id}/`)
  },

  approveReview: (id: string, comment?: string) => {
    return request.post<Review>(`/api/reviews/${id}/approve/`, { comment })
  },

  rejectReview: (id: string, comment?: string) => {
    return request.post<Review>(`/api/reviews/${id}/reject/`, { comment })
  },

  flagReview: (id: string, comment?: string) => {
    return request.post<Review>(`/api/reviews/${id}/flag/`, { comment })
  },

  batchApproveReviews: (ids: string[], comment?: string) => {
    return request.post<{ success: number; failed: number }>('/api/reviews/batch-approve/', { ids, comment })
  },

  batchRejectReviews: (ids: string[], comment?: string) => {
    return request.post<{ success: number; failed: number }>('/api/reviews/batch-reject/', { ids, comment })
  },

  getPendingReviewCount: () => {
    return request.get<{ count: number }>('/api/reviews/pending-count/')
  },

  getReviewStats: () => {
    return request.get<{
      total: number
      pending: number
      approved: number
      rejected: number
      flagged: number
    }>('/api/reviews/stats/')
  },
}

// ==================== 统计API ====================

export const statsApi = {
  getOverviewStats: () => {
    return request.get<OverviewStats>('/api/stats/overview/')
  },

  getAccuracyStats: (params?: AccuracyStatsParams) => {
    return request.get<AccuracyStats[]>('/api/stats/accuracy/', { params })
  },

  getDailyStats: (params?: DailyStatsParams) => {
    return request.get<DailyStats[]>('/api/stats/daily/', { params })
  },

  getErrorStats: (params?: ErrorStatsParams) => {
    return request.get<{
      timeout: number
      rate_limit: number
      api_error: number
      content_filter: number
      other: number
    }>('/api/stats/errors/', { params })
  },

  getSalesOperationRanking: () => {
    return request.get<{ sales_operation: string; total_calls: number; accuracy_rate: number }[]>(
      '/api/stats/sales-operation-ranking/',
    )
  },

  getPromptVersionRanking: () => {
    return request.get<{ prompt_version: string; total_calls: number; accuracy_rate: number }[]>(
      '/api/stats/prompt-version-ranking/',
    )
  },
}

// ==================== 风险样本API ====================

export const riskApi = {
  getRiskSamples: (params: RiskSampleListParams) => {
    return request.get<DRFPaginationResult<RiskSample>>('/api/risk-samples/', { params })
  },

  getRiskSample: (id: string) => {
    return request.get<RiskSample>(`/api/risk-samples/${id}/`)
  },

  createRiskSample: (data: Partial<RiskSample>) => {
    return request.post<RiskSample>('/api/risk-samples/', data)
  },

  updateRiskSample: (id: string, data: Partial<RiskSample>) => {
    return request.put<RiskSample>(`/api/risk-samples/${id}/`, data)
  },

  confirmRiskSample: (id: string, comment?: string) => {
    return request.post<RiskSample>(`/api/risk-samples/${id}/confirm/`, { comment })
  },

  resolveRiskSample: (id: string, comment?: string) => {
    return request.post<RiskSample>(`/api/risk-samples/${id}/resolve/`, { comment })
  },

  markFalsePositive: (id: string, comment?: string) => {
    return request.post<RiskSample>(`/api/risk-samples/${id}/false-positive/`, { comment })
  },

  batchProcessRiskSamples: (ids: string[], action: string, comment?: string) => {
    return request.post<{ success: number; failed: number }>('/api/risk-samples/batch-process/', {
      ids,
      action,
      comment,
    })
  },

  exportRiskSamples: (params?: RiskSampleListParams) => {
    return request.get<string>('/api/risk-samples/export/', { params })
  },

  getRiskStats: () => {
    return request.get<{
      total: number
      pending: number
      confirmed: number
      resolved: number
      false_positive: number
      by_level: Record<string, number>
    }>('/api/risk-samples/stats/')
  },

  getRiskRules: () => {
    return request.get<RiskRule[]>('/api/risk-rules/')
  },

  createRiskRule: (data: Partial<RiskRule>) => {
    return request.post<RiskRule>('/api/risk-rules/', data)
  },

  updateRiskRule: (id: string, data: Partial<RiskRule>) => {
    return request.put<RiskRule>(`/api/risk-rules/${id}/`, data)
  },

  deleteRiskRule: (id: string) => {
    return request.delete(`/api/risk-rules/${id}/`)
  },

  toggleRiskRule: (id: string) => {
    return request.post<RiskRule>(`/api/risk-rules/${id}/toggle/`)
  },
}

// ==================== Mock 数据 API (用于演示) ====================

const mockDelay = <T>(data: T, delay = 300): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), delay))

const mockReviews: ReviewItem[] = Array.from({ length: 35 }, (_, i) => ({
  id: `R${String(i + 1).padStart(4, '0')}`,
  content: `这是第 ${i + 1} 条待审核的用户咨询内容，包含产品咨询、售后问题、账户问题等多种类型。用户反馈的问题涉及订单查询、退款申请、密码找回等常见客服场景。`,
  type: (['text', 'image', 'voice', 'video'] as const)[i % 4],
  status: (['pending', 'approved', 'rejected', 'followup'] as const)[i % 4],
  salesGroup: ['华东组', '华北组', '华南组', '西南组'][i % 4],
  promptVersion: `v${Math.floor(i / 5) + 1}.${i % 5}.0`,
  riskLevel: (['low', 'medium', 'high', 'critical'] as const)[i % 4],
  submitTime: `2024-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')} ${String((i % 24)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:00`,
  aiSuggestion: 'AI 建议：该内容包含敏感词汇，建议人工审核后再决定是否通过。',
  riskTags: ['敏感词', '投诉', '退款'],
  reviewHistory: [
    {
      id: 'h1',
      action: '提交审核',
      operator: '系统',
      time: '2024-01-15 10:00:00',
    },
    {
      id: 'h2',
      action: 'AI 初审',
      operator: 'AI系统',
      time: '2024-01-15 10:01:00',
      comment: '检测到敏感内容，建议人工复核',
    },
  ],
}))

const mockPrompts: PromptItem[] = Array.from({ length: 20 }, (_, i) => ({
  id: `P${String(i + 1).padStart(4, '0')}`,
  title: ['客服问候语', '产品介绍模板', '售后处理流程', '投诉应对话术', '退款申请指引'][i % 5] + ` v${i + 1}`,
  version: `v${Math.floor(i / 3) + 1}.${i % 3}.0`,
  status: (['draft', 'active', 'inactive'] as const)[i % 3],
  category: ['问候类', '产品类', '售后类', '投诉类', '通用类'][i % 5],
  usageCount: Math.floor(Math.random() * 10000),
  accuracy: 85 + Math.floor(Math.random() * 15),
  grayScale: [0, 30, 50, 100][i % 4],
  applicableGroups: ['华东组', '华北组', '华南组', '西南组'].slice(0, (i % 4) + 1),
  createTime: `2024-0${(i % 9) + 1}-01 00:00:00`,
  author: ['张三', '李四', '王五', '赵六'][i % 4],
  content: `这是提示词 ${i + 1} 的内容。
## 角色设定
你是一位专业的客服人员，需要热情、耐心地回答用户的问题。

## 回答要求
1. 首先问候用户
2. 仔细倾听用户的问题
3. 提供清晰、准确的解答
4. 如无法解决，引导用户转人工客服`,
  updateTime: `2024-0${(i % 9) + 1}-15 12:00:00`,
}))

const mockPromptVersions: PromptVersionHistory[] = Array.from({ length: 8 }, (_, i) => ({
  id: `V${String(i + 1).padStart(4, '0')}`,
  version: `v${Math.floor(i / 2) + 1}.${i % 2}.0`,
  status: (['draft', 'active', 'inactive'] as const)[i % 3],
  createTime: `2024-0${(i % 9) + 1}-01 00:00:00`,
  author: ['张三', '李四', '王五', '赵六'][i % 4],
  content: `历史版本 ${i + 1} 的提示词内容...`,
}))

const mockRisks: RiskItem[] = Array.from({ length: 40 }, (_, i) => ({
  id: `K${String(i + 1).padStart(4, '0')}`,
  title: ['敏感词检测', '恶意攻击', '数据泄露', '违规内容', '欺诈风险'][i % 5] + ` - 样本 ${i + 1}`,
  riskLevel: (['low', 'medium', 'high', 'critical'] as const)[i % 4],
  category: ['敏感词', '违规内容', '安全风险', '欺诈行为', '其他'][i % 5],
  source: ['AI检测', '人工举报', '系统监控', '第三方告警'][i % 4],
  status: (['pending', 'confirmed', 'processed', 'false_positive'] as const)[i % 4],
  tags: ['敏感词', '高风险', '需关注'].slice(0, (i % 3) + 1),
  createTime: `2024-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')} ${String((i % 24)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:00`,
  handler: ['张三', '李四', '王五', '赵六', undefined][i % 5] as string | undefined,
  content: `这是第 ${i + 1} 条风险样本的详细内容。
包含具体的风险描述、影响范围、处理建议等信息。
需要审核人员仔细判断并采取相应措施。`,
  relatedSessionId: `S${String(i + 1).padStart(6, '0')}`,
  processHistory: [
    {
      id: 'ph1',
      action: '风险检测',
      operator: 'AI系统',
      time: '2024-01-15 09:00:00',
      comment: '自动检测到高风险内容',
    },
    {
      id: 'ph2',
      action: '人工确认',
      operator: '张三',
      time: '2024-01-15 10:30:00',
      comment: '确认风险属实',
    },
  ],
}))

export const mockReviewApi = {
  getList: (params: ReviewQueryParams): Promise<PageResult<ReviewItem>> => {
    const { page = 1, pageSize = 10, status, type, salesGroup, promptVersion, keyword } = params
    let filtered = [...mockReviews]
    if (status && status !== 'all') {
      filtered = filtered.filter((item) => item.status === status)
    }
    if (type && type !== 'all') {
      filtered = filtered.filter((item) => item.type === type)
    }
    if (salesGroup) {
      filtered = filtered.filter((item) => item.salesGroup === salesGroup)
    }
    if (promptVersion) {
      filtered = filtered.filter((item) => item.promptVersion === promptVersion)
    }
    if (keyword) {
      filtered = filtered.filter((item) => item.content.includes(keyword))
    }
    const start = (page - 1) * pageSize
    const end = start + pageSize
    return mockDelay({
      list: filtered.slice(start, end),
      total: filtered.length,
      page,
      pageSize,
    })
  },

  getStats: (): Promise<ReviewStats> => {
    const approved = mockReviews.filter((r) => r.status === 'approved').length
    const rejected = mockReviews.filter((r) => r.status === 'rejected').length
    const pending = mockReviews.filter((r) => r.status === 'pending').length
    const total = approved + rejected
    return mockDelay({
      pending,
      approved,
      rejected,
      passRate: total > 0 ? Math.round((approved / total) * 100) : 0,
    })
  },

  getDetail: (id: string): Promise<ReviewItem | undefined> => {
    return mockDelay(mockReviews.find((r) => r.id === id))
  },

  approve: (ids: string[], comment?: string): Promise<void> => {
    console.log('Approve:', ids, comment)
    return mockDelay(undefined)
  },

  reject: (ids: string[], reason: string): Promise<void> => {
    console.log('Reject:', ids, reason)
    return mockDelay(undefined)
  },

  markFollowup: (id: string): Promise<void> => {
    console.log('Mark followup:', id)
    return mockDelay(undefined)
  },
}

export const mockPromptApi = {
  getList: (params: PromptQueryParams): Promise<PageResult<PromptItem>> => {
    const { page = 1, pageSize = 10, status, category, version, keyword } = params
    let filtered = [...mockPrompts]
    if (status && status !== 'all') {
      filtered = filtered.filter((item) => item.status === status)
    }
    if (category) {
      filtered = filtered.filter((item) => item.category === category)
    }
    if (version) {
      filtered = filtered.filter((item) => item.version.includes(version))
    }
    if (keyword) {
      filtered = filtered.filter((item) => item.title.includes(keyword))
    }
    const start = (page - 1) * pageSize
    const end = start + pageSize
    return mockDelay({
      list: filtered.slice(start, end),
      total: filtered.length,
      page,
      pageSize,
    })
  },

  getDetail: (id: string): Promise<PromptItem | undefined> => {
    return mockDelay(mockPrompts.find((p) => p.id === id))
  },

  create: (data: Partial<PromptItem>): Promise<PromptItem> => {
    console.log('Create prompt:', data)
    return mockDelay({ ...mockPrompts[0], ...data, id: `P${Date.now()}` } as PromptItem)
  },

  update: (id: string, data: Partial<PromptItem>): Promise<PromptItem> => {
    console.log('Update prompt:', id, data)
    return mockDelay({ ...mockPrompts[0], ...data, id } as PromptItem)
  },

  publish: (id: string): Promise<void> => {
    console.log('Publish prompt:', id)
    return mockDelay(undefined)
  },

  deactivate: (id: string): Promise<void> => {
    console.log('Deactivate prompt:', id)
    return mockDelay(undefined)
  },

  getVersionHistory: (id: string): Promise<PromptVersionHistory[]> => {
    console.log('Get version history:', id)
    return mockDelay(mockPromptVersions)
  },

  rollback: (id: string, versionId: string): Promise<void> => {
    console.log('Rollback:', id, versionId)
    return mockDelay(undefined)
  },
}

export const mockRiskApi = {
  getList: (params: RiskQueryParams): Promise<PageResult<RiskItem>> => {
    const { page = 1, pageSize = 10, riskLevel, category, source, status, keyword } = params
    let filtered = [...mockRisks]
    if (riskLevel && riskLevel !== 'all') {
      filtered = filtered.filter((item) => item.riskLevel === riskLevel)
    }
    if (category) {
      filtered = filtered.filter((item) => item.category === category)
    }
    if (source) {
      filtered = filtered.filter((item) => item.source === source)
    }
    if (status && status !== 'all') {
      filtered = filtered.filter((item) => item.status === status)
    }
    if (keyword) {
      filtered = filtered.filter((item) => item.title.includes(keyword))
    }
    const start = (page - 1) * pageSize
    const end = start + pageSize
    return mockDelay({
      list: filtered.slice(start, end),
      total: filtered.length,
      page,
      pageSize,
    })
  },

  getStats: (): Promise<RiskStats> => {
    const pending = mockRisks.filter((r) => r.status === 'pending').length
    const highRisk = mockRisks.filter((r) => r.riskLevel === 'high' || r.riskLevel === 'critical').length
    return mockDelay({
      total: mockRisks.length,
      pending,
      highRisk,
      weeklyNew: 12,
    })
  },

  getDetail: (id: string): Promise<RiskItem | undefined> => {
    return mockDelay(mockRisks.find((r) => r.id === id))
  },

  confirm: (ids: string[]): Promise<void> => {
    console.log('Confirm risks:', ids)
    return mockDelay(undefined)
  },

  process: (ids: string[], comment: string): Promise<void> => {
    console.log('Process risks:', ids, comment)
    return mockDelay(undefined)
  },

  markFalsePositive: (ids: string[]): Promise<void> => {
    console.log('Mark false positive:', ids)
    return mockDelay(undefined)
  },
}

export { request }
