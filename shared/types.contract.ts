# ============================================================
# 共享类型定义 (前端/后端均可引用)
# ============================================================
# 注意：实际项目中可在 frontend/src/types 和 backend/app/types
# 中各自维护，这里作为跨端复用的契约参考

export type UserRole = 'sales' | 'ops' | 'admin'

export type ResourceStatus = 'draft' | 'published' | 'archived'

export type EmailStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'used'

export type ReviewAction = 'approve' | 'reject'

export interface PaginationParams {
  page: number
  perPage: number
}

export interface PaginationMeta {
  total: number
  page: number
  perPage: number
  lastPage: number
  hasNext: boolean
  hasPrevious: boolean
}

export interface ApiResponse<T = any> {
  code: number
  message: string
  data?: T
  pagination?: PaginationMeta
  errors?: Array<{ field: string; message: string }>
}

export type CostDimension = 'date' | 'user' | 'reviewer' | 'reason'

export type RejectReasonCode =
  | 'CONTENT_INACCURATE'
  | 'TONE_INAPPROPRIATE'
  | 'POOR_STRUCTURE'
  | 'MISSING_INFO'
  | 'RISK_CONTENT'
  | 'OTHER'
