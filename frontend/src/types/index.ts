export type UserRole = 'admin' | 'reviewer' | 'operator'

export interface User {
  id: string
  username: string
  password?: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  department?: string
  createdAt: string
  lastLoginAt?: string
}

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: Omit<User, 'password'>
}

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface PaginationParams {
  page: number
  pageSize: number
  keyword?: string
  [key: string]: unknown
}

export interface PaginationResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export type KnowledgeCategory = 'policy' | 'product' | 'compliance' | 'procedure' | 'faq'

export interface KnowledgeBase {
  id: string
  title: string
  category: KnowledgeCategory
  content: string
  tags: string[]
  version: string
  status: 'active' | 'draft' | 'archived'
  createdBy: string
  createdAt: string
  updatedAt: string
  references?: string[]
}

export interface TemplateStatus {
  id: string
  name: string
  description: string
  content: string
  variables: string[]
  version: string
  category: string
  status: 'active' | 'draft' | 'deprecated'
  isDefault: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
  approvedBy?: string
  approvedAt?: string
}

export interface PromptVersion {
  id: string
  name: string
  systemPrompt: string
  userPrompt: string
  temperature: number
  maxTokens: number
  topP: number
  version: string
  model: string
  status: 'active' | 'testing' | 'deprecated'
  changeLog: string
  createdBy: string
  createdAt: string
  approvedBy?: string
  approvedAt?: string
  accuracy?: number
  testCasesPassed?: number
  testCasesTotal?: number
}

export type EmailStatus = 'draft' | 'ai_generated' | 'pending_review' | 'approved' | 'sent' | 'rejected'

export type EmailPriority = 'low' | 'normal' | 'high' | 'urgent'
export type RiskLevel = 'none' | 'low' | 'medium' | 'high' | 'critical'

export interface EmailAttachment {
  id: string
  name: string
  size: number
  type: string
}

export interface RiskItem {
  type: string
  description: string
  level: RiskLevel
  suggestion?: string
}

export interface EmailDraft {
  id: string
  subject: string
  recipient: string
  recipientName?: string
  cc?: string[]
  content: string
  htmlContent?: string
  status: EmailStatus
  priority: EmailPriority
  category: string
  templateId?: string
  promptId?: string
  knowledgeIds?: string[]
  attachments?: EmailAttachment[]
  aiSuggestion?: string
  riskLevel: RiskLevel
  riskItems?: RiskItem[]
  generatedBy?: string
  reviewedBy?: string
  sentBy?: string
  createdAt: string
  updatedAt: string
  reviewedAt?: string
  sentAt?: string
}

export type ReviewResult = 'approved' | 'rejected' | 'modified'

export interface ReviewRecord {
  id: string
  emailId: string
  emailSubject: string
  reviewerId: string
  reviewerName: string
  result: ReviewResult
  comments: string
  modifications?: string
  riskLevelAfter: RiskLevel
  createdAt: string
}

export interface RiskSample {
  id: string
  emailId: string
  emailSubject: string
  riskType: string
  riskLevel: RiskLevel
  description: string
  originalContent: string
  suggestedContent?: string
  detectedAt: string
  handled: boolean
  handledBy?: string
  handledAt?: string
  handlerComment?: string
  sampleCategory: string
}

export interface DailyStats {
  date: string
  emailsGenerated: number
  emailsReviewed: number
  emailsSent: number
  reviewsPending: number
  avgResponseTime: number
}

export interface CategoryStats {
  category: string
  count: number
  percentage: number
}

export interface RiskStats {
  level: RiskLevel
  count: number
  percentage: number
}

export interface CostStats {
  date: string
  tokensIn: number
  tokensOut: number
  cost: number
  model: string
}

export interface PerformanceMetrics {
  totalEmails: number
  aiAccuracyRate: number
  reviewEfficiency: number
  avgProcessingTime: number
  riskDetectionRate: number
}

export interface AnalyticsData {
  dailyStats: DailyStats[]
  categoryStats: CategoryStats[]
  riskStats: RiskStats[]
  costStats: CostStats[]
  performance: PerformanceMetrics
  topTemplates: { name: string; usageCount: number }[]
  reviewerStats: { name: string; reviewed: number; approved: number }[]
}

export type LogAction = 'login' | 'logout' | 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'generate' | 'send' | 'review' | 'export'
export type LogModule = 'auth' | 'knowledge' | 'template' | 'prompt' | 'email' | 'review' | 'risk' | 'user' | 'analytics' | 'system'

export interface OperationLog {
  id: string
  userId: string
  userName: string
  module: LogModule
  action: LogAction
  targetId?: string
  targetName?: string
  description: string
  ip?: string
  userAgent?: string
  status: 'success' | 'failed'
  errorMessage?: string
  createdAt: string
}

export interface DashboardSummary {
  totalEmailsToday: number
  pendingReviews: number
  highRiskCount: number
  sentToday: number
  aiAccuracyRate: number
  averageReviewTime: number
}
