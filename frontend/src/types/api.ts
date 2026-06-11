export interface DRFPaginationResult<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
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

export interface SendMessageResponse {
  user_message: Message
  ai_message: Message
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

export interface ConversationListParams {
  sales_operation?: string
  channel?: string
  priority?: string
  status?: string
  keyword?: string
  page?: number
  page_size?: number
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'flagged'
export type ReviewType = 'text' | 'image' | 'voice' | 'video'
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type PromptStatus = 'draft' | 'enabled' | 'disabled'
export type RiskStatus = 'pending' | 'confirmed' | 'resolved' | 'false_positive'

export interface Review {
  id: number
  message: number
  message_content?: string
  message_role?: string
  conversation_id?: number
  review_type: string
  review_type_display?: string
  status: ReviewStatus
  status_display?: string
  reviewer?: number
  reviewer_name?: string
  comment?: string
  risk_level: RiskLevel
  flagged_by_ai?: boolean
  sales_operation?: string
  prompt_version?: string
  ai_model?: string
  is_accurate?: boolean
  inaccuracy_reason?: string
  risk_tags?: string[]
  created_at: string
  reviewed_at?: string
}

export interface ReviewListParams {
  status?: ReviewStatus
  review_type?: string
  risk_level?: RiskLevel
  sales_operation?: string
  prompt_version?: string
  start_date?: string
  end_date?: string
  keyword?: string
  page?: number
  page_size?: number
}

export interface ReviewStatsResult {
  total: number
  pending: number
  approved: number
  rejected: number
  flagged: number
  approval_rate: number
  rejection_rate: number
  flagged_rate: number
  accuracy_rate: number
  reviewed_with_accuracy: number
}

export interface ReviewRule {
  id: number
  name: string
  description: string
  rule_type: string
  pattern: string
  is_active: boolean
  severity: string
  created_at: string
  updated_at: string
}

export interface Prompt {
  id: number
  title: string
  content?: string
  description?: string
  category?: number
  category_name?: string
  author?: number
  author_name?: string
  status: PromptStatus
  version: string
  is_current_version?: boolean
  gray_scale_percent?: number
  target_sales_operations?: string[]
  accuracy_rate: number
  usage_count: number
  variables?: Record<string, unknown>
  parent_prompt?: number
  versions?: PromptVersion[]
  created_at: string
  updated_at?: string
}

export interface PromptCategory {
  id: number
  name: string
  description?: string
  parent?: number
  sort_order?: number
  created_at: string
}

export interface PromptVersion {
  id: number
  title: string
  version: string
  status: PromptStatus
  author_name?: string
  is_current_version: boolean
  created_at: string
  updated_at?: string
}

export interface PromptListParams {
  status?: PromptStatus
  category?: number | string
  version?: string
  keyword?: string
  page?: number
  page_size?: number
}

export interface OverviewStats {
  total_conversations: number
  total_messages: number
  total_ai_calls: number
  total_reviews: number
  total_risks: number
  accuracy_rate: number
  ai_adoption_rate: number
  approval_rate: number
  risk_resolution_rate: number
  total_tokens: number
  total_cost: number
}

export interface AccuracyStats {
  id: number
  date: string
  sales_operation: string
  prompt_version: string
  total_calls: number
  accurate_calls: number
  accuracy_rate: number
  error_timeout: number
  error_rate_limit: number
  error_api_error: number
  error_content_filter: number
  error_other: number
  avg_response_time: number
  created_at: string
}

export interface DailyStats {
  id: number
  date: string
  total_conversations: number
  total_messages: number
  ai_suggestion_count: number
  ai_adoption_count: number
  ai_adoption_rate: number
  total_reviews: number
  approved_reviews: number
  rejected_reviews: number
  pending_reviews: number
  total_risks: number
  resolved_risks: number
  avg_response_time: number
  total_tokens: number
  total_cost: number
  created_at: string
}

export interface AccuracyStatsParams {
  start_date?: string
  end_date?: string
  sales_operation?: string
  prompt_version?: string
  group_by?: string
}

export interface DailyStatsParams {
  start_date?: string
  end_date?: string
  sales_operation?: string
}

export interface ErrorStatsParams {
  start_date?: string
  end_date?: string
  sales_operation?: string
  prompt_version?: string
}

export interface ErrorStatItem {
  error_type: string
  error_type_name: string
  count: number
  percentage: number
}

export interface ErrorStatsResult {
  total_errors: number
  errors: ErrorStatItem[]
}

export interface SalesOperationRankingItem {
  sales_operation: string
  total_calls: number
  accurate_calls: number
  accuracy_rate: number
}

export interface PromptVersionRankingItem {
  prompt_version: string
  total_calls: number
  accurate_calls: number
  accuracy_rate: number
}

export interface RiskSample {
  id: number
  title: string
  content?: string
  risk_level: RiskLevel
  risk_level_display?: string
  risk_category: string
  risk_category_display?: string
  source: string
  source_display?: string
  status: RiskStatus
  status_display?: string
  tags?: string[]
  assignee?: number
  assignee_name?: string
  handled_by?: number
  handled_by_name?: string
  handle_comment?: string
  handled_at?: string
  conversation?: number
  conversation_title?: string
  message?: number
  message_content?: string
  created_at: string
  updated_at?: string
}

export interface RiskRule {
  id: number
  name: string
  rule_type: string
  rule_type_display?: string
  pattern: string
  risk_level: RiskLevel
  risk_level_display?: string
  is_active: boolean
  description?: string
  created_at: string
  updated_at: string
}

export interface RiskSampleListParams {
  risk_level?: RiskLevel
  risk_category?: string
  source?: string
  status?: RiskStatus
  start_date?: string
  end_date?: string
  keyword?: string
  page?: number
  page_size?: number
}

export interface RiskStatsResult {
  total: number
  pending: number
  confirmed: number
  resolved: number
  false_positive: number
  resolution_rate: number
  by_level: { risk_level: string; count: number }[]
  by_category: { risk_category: string; count: number }[]
}

// ========== 页面组件使用的 camelCase 类型 ==========

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

export interface ReviewHistoryItem {
  id: string
  action: string
  operator: string
  time: string
  comment?: string
}

export interface ReviewQueryParams extends PageParams {
  status?: ReviewStatus | 'all'
  type?: ReviewType | 'all'
  salesGroup?: string
  promptVersion?: string
  dateRange?: [string, string]
  keyword?: string
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
