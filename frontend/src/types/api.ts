export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface PageParams {
  page: number
  pageSize: number
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface DRFPaginationResult<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface Conversation {
  id: number
  title: string
  customer_name: string
  customer_phone: string
  sales_operation: string
  channel: string
  priority: string
  status: string
  messages_count?: number
  last_message_time?: string
  last_message_content?: string
  ai_suggestion_adoption_rate?: number
  created_at: string
  updated_at?: string
}

export interface ConversationDetail extends Conversation {
  messages?: Message[]
}

export interface Message {
  id: number
  role: 'user' | 'assistant' | 'system'
  content: string
  tokens_used?: number
  is_ai_suggestion?: boolean
  is_adopted?: boolean
  ai_model?: string
  prompt_version?: string
  error_type?: string
  error_message?: string
  suggested_reply?: string
  review_status?: string
  created_at: string
}

export interface AISuggestion {
  message_id?: number
  suggested_reply?: string
  ai_model?: string
  prompt_version?: string
  status: 'pending' | 'completed' | 'error'
  message?: string
  error_type?: string
  error_message?: string
  created_at?: string
}

export interface ConversationFilterParams {
  sales_operation?: string
  channel?: string
  priority?: string
  status?: string
  keyword?: string
  page?: number
  pageSize?: number
}

export type ConversationListParams = ConversationFilterParams

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'followup'
export type ReviewType = 'text' | 'image' | 'voice' | 'video'
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type PromptStatus = 'draft' | 'active' | 'inactive'
export type RiskStatus = 'pending' | 'confirmed' | 'processed' | 'false_positive'

export interface Review {
  id: number
  content: string
  type: ReviewType
  status: ReviewStatus
  sales_operation: string
  prompt_version: string
  risk_level: RiskLevel
  submitted_at: string
  ai_suggestion?: string
  risk_tags?: string[]
  review_history?: ReviewHistoryItem[]
}

export interface ReviewHistoryItem {
  id: string
  action: string
  operator: string
  time: string
  comment?: string
}

export type ReviewListParams = {
  status?: ReviewStatus
  type?: ReviewType
  sales_operation?: string
  prompt_version?: string
  keyword?: string
  page?: number
  pageSize?: number
}

export interface Prompt {
  id: number
  title: string
  version: string
  status: PromptStatus
  category: string
  usage_count: number
  accuracy_rate: number
  gray_scale: number
  applicable_groups: string[]
  created_at: string
  author: string
  content?: string
  updated_at?: string
}

export interface PromptCategory {
  id: number
  name: string
  description?: string
}

export type PromptListParams = {
  status?: PromptStatus
  category?: string
  version?: string
  keyword?: string
  page?: number
  pageSize?: number
}

export interface OverviewStats {
  total_conversations: number
  total_messages: number
  ai_suggestions_count: number
  adoption_rate: number
  average_response_time: number
  customer_satisfaction: number
}

export interface AccuracyStats {
  date: string
  total_count: number
  correct_count: number
  accuracy_rate: number
}

export interface DailyStats {
  date: string
  conversations_count: number
  messages_count: number
  ai_suggestions_count: number
}

export interface AccuracyStatsParams {
  start_date?: string
  end_date?: string
  prompt_version?: string
  sales_operation?: string
}

export interface DailyStatsParams {
  start_date?: string
  end_date?: string
  sales_operation?: string
}

export interface ErrorStatsParams {
  start_date?: string
  end_date?: string
}

export interface RiskSample {
  id: number
  title: string
  risk_level: RiskLevel
  category: string
  source: string
  status: RiskStatus
  tags: string[]
  created_at: string
  handler?: string
  content?: string
  related_session_id?: string
  process_history?: RiskProcessHistoryItem[]
}

export interface RiskRule {
  id: number
  name: string
  description: string
  rule_type: string
  is_enabled: boolean
  created_at: string
  updated_at: string
}

export type RiskSampleListParams = {
  risk_level?: RiskLevel
  category?: string
  source?: string
  status?: RiskStatus
  keyword?: string
  page?: number
  pageSize?: number
}

// ========== 以下为页面使用的类型 (camelCase) ==========

export interface ReviewItem {
  id: string
  content: string
  type: ReviewType
  status: ReviewStatus
  salesGroup: string
  promptVersion: string
  riskLevel: RiskLevel
  submitTime: string
  aiSuggestion?: string
  riskTags?: string[]
  reviewHistory?: ReviewHistoryItem[]
}

export interface ReviewQueryParams extends PageParams {
  status?: ReviewStatus | 'all'
  type?: ReviewType | 'all'
  salesGroup?: string
  promptVersion?: string
  dateRange?: [string, string]
  keyword?: string
}

export interface ReviewStats {
  pending: number
  approved: number
  rejected: number
  passRate: number
}

export interface PromptItem {
  id: string
  title: string
  version: string
  status: PromptStatus
  category: string
  usageCount: number
  accuracy: number
  grayScale: number
  applicableGroups: string[]
  createTime: string
  author: string
  content?: string
  updateTime?: string
}

export interface PromptQueryParams extends PageParams {
  status?: PromptStatus | 'all'
  category?: string
  version?: string
  keyword?: string
}

export interface PromptVersionHistory {
  id: string
  version: string
  status: PromptStatus
  createTime: string
  author: string
  content?: string
}

export interface RiskItem {
  id: string
  title: string
  riskLevel: RiskLevel
  category: string
  source: string
  status: RiskStatus
  tags: string[]
  createTime: string
  handler?: string
  content?: string
  relatedSessionId?: string
  processHistory?: RiskProcessHistoryItem[]
}

export interface RiskProcessHistoryItem {
  id: string
  action: string
  operator: string
  time: string
  comment?: string
}

export interface RiskQueryParams extends PageParams {
  riskLevel?: RiskLevel | 'all'
  category?: string
  source?: string
  status?: RiskStatus | 'all'
  dateRange?: [string, string]
  keyword?: string
}

export interface RiskStats {
  total: number
  pending: number
  highRisk: number
  weeklyNew: number
}
