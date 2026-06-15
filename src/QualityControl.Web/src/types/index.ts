export interface ApiResponse<T> {
  success: boolean
  code: number
  message: string
  data?: T
  error?: ErrorDetails
}

export interface ErrorDetails {
  errorCode: string
  errorMessage: string
  nextStep: string
  detailedDescription?: string
  supportUrl?: string
  additionalInfo?: Record<string, any>
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  pageIndex: number
  pageSize: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface PagedQuery {
  pageIndex?: number
  pageSize?: number
  sortBy?: string
  sortDesc?: boolean
  keyword?: string
}

export interface Session {
  id: number
  sessionNumber: string
  customerId: number
  customerName?: string
  agentId: number
  agentName?: string
  title: string
  status: number
  statusText?: string
  problemDescription?: string
  relatedTicketId?: number
  createdAt: string
  firstResponseAt?: string
  resolvedAt?: string
  closedAt?: string
  responseTimeSeconds?: number
  responseTimeDisplay?: string
  resolutionTimeSeconds?: number
  channel?: string
  tags?: string
  isInspected: boolean
  inspectedAt?: string
  inspectorId?: number
  inspectorName?: string
  inspectionScore?: number
  messageCount?: number
  attachmentCount?: number
  hasRating?: boolean
  ratingScore?: number
}

export interface SessionQuery extends PagedQuery {
  agentId?: number
  customerId?: number
  status?: number
  channel?: string
  startTime?: string
  endTime?: string
  isInspected?: boolean
  minResponseTime?: number
  maxResponseTime?: number
  tag?: string
}

export interface SessionStatistics {
  totalSessions: number
  pendingSessions: number
  inProgressSessions: number
  resolvedSessions: number
  inspectedSessions: number
  uninspectedSessions: number
  averageResponseTime: number
  averageResolutionTime: number
  averageInspectionScore: number
  customerSatisfactionRate: number
  todaySessions: number
}

export interface SessionMessage {
  id: number
  sessionId: number
  senderType: number
  senderTypeText?: string
  senderId?: number
  senderName?: string
  content: string
  sentAt: string
  isRead: boolean
  attachments: Attachment[]
}

export interface Attachment {
  id: number
  fileName: string
  fileType: string
  fileSize: number
  filePath: string
  contentType?: string
  uploadedAt: string
  uploaderName?: string
}

export interface QualityInspection {
  id: number
  inspectionNumber: string
  sessionId: number
  sessionNumber?: string
  sessionTitle?: string
  inspectorId: number
  inspectorName?: string
  status: number
  statusText?: string
  overallComment?: string
  totalScore: number
  maxScore: number
  scorePercentage: number
  improvementSuggestion?: string
  isRequiresRetrain: boolean
  createdAt: string
  completedAt?: string
  relatedTicketId?: number
  inspectionItems: InspectionItem[]
}

export interface InspectionItem {
  id: number
  inspectionId: number
  itemName: string
  description?: string
  category: string
  maxScore: number
  score: number
  isDeducted: boolean
  deductionReason?: string
  sortOrder: number
}

export interface InspectionTemplate {
  id: number
  name: string
  description?: string
  isActive: boolean
  version: number
  applicableDepartment?: string
  createdAt: string
  items: InspectionTemplateItem[]
}

export interface InspectionTemplateItem {
  id: number
  itemName: string
  description?: string
  category: string
  maxScore: number
  sortOrder: number
  isRequired: boolean
}

export interface InspectionStatistics {
  totalInspections: number
  completedInspections: number
  pendingInspections: number
  averageScore: number
  passRate: number
  requiresRetrainCount: number
  categoryScores?: CategoryScore[]
  agentRanks?: AgentRank[]
}

export interface CategoryScore {
  category: string
  averageScore: number
  maxScore: number
}

export interface InspectionQuery extends PagedQuery {
  sessionId?: number
  inspectorId?: number
  status?: number
  minScore?: number
  maxScore?: number
  isRequiresRetrain?: boolean
  startTime?: string
  endTime?: string
}

export interface AgentRank {
  agentId: number
  agentName?: string
  departmentId: number
  departmentName?: string
  averageScore: number
  inspectionCount: number
}

export interface Ticket {
  id: number
  ticketNumber: string
  type: number
  typeText?: string
  title: string
  description: string
  priority: number
  priorityText?: string
  status: number
  statusText?: string
  assigneeDepartmentId: number
  assigneeDepartmentName?: string
  assigneeId?: number
  assigneeName?: string
  creatorId?: number
  creatorName?: string
  customerId?: number
  customerName?: string
  relatedSessionId?: number
  relatedSessionNumber?: string
  relatedInspectionId?: number
  relatedInspectionNumber?: string
  tags?: string
  createdAt: string
  dueDate?: string
  resolvedAt?: string
  closedAt?: string
  resolution?: string
  commentCount?: number
  attachmentCount?: number
}

export interface TicketQuery extends PagedQuery {
  type?: number
  priority?: number
  status?: number
  assigneeDepartmentId?: number
  assigneeId?: number
  creatorId?: number
  customerId?: number
  relatedSessionId?: number
  startTime?: string
  endTime?: string
}

export interface TicketComment {
  id: number
  ticketId: number
  commenterId: number
  commenterName?: string
  commenterRole?: string
  content: string
  isInternal: boolean
  createdAt: string
  attachments: Attachment[]
}

export interface KnowledgeBase {
  id: number
  title: string
  content: string
  summary?: string
  category: string
  status: number
  statusText?: string
  isExpired: boolean
  expiryDate?: string
  viewCount: number
  useCount: number
  helpfulCount: number
  notHelpfulCount: number
  remark?: string
  processingResult?: string
  authorId?: number
  authorName?: string
  reviewerId?: number
  reviewerName?: string
  createdAt: string
  updatedAt?: string
  lastUsedAt?: string
  lastReviewAt?: string
  tags?: string
  daysUntilExpiry: number
}

export interface KnowledgeBaseQuery extends PagedQuery {
  category?: string
  status?: number
  isExpired?: boolean
  needReview?: boolean
  authorId?: number
  startTime?: string
  endTime?: string
}

export interface KnowledgeReviewRecord {
  id: number
  knowledgeBaseId: number
  reviewerId: number
  reviewerName?: string
  result: number
  resultText?: string
  comment?: string
  processingResult?: string
  customerSatisfaction?: string
  reviewedAt: string
}

export interface KnowledgeStatistics {
  totalKnowledge: number
  publishedKnowledge: number
  expiredKnowledge: number
  needReviewKnowledge: number
  totalViews: number
  totalUses: number
  helpfulRate: number
  categoryCounts?: CategoryKnowledgeCount[]
}

export interface CategoryKnowledgeCount {
  category: string
  count: number
}

export interface ServiceRating {
  id: number
  sessionId: number
  sessionNumber?: string
  customerId: number
  customerName?: string
  agentId: number
  agentName?: string
  overallRating: number
  responseSpeedRating?: number
  professionalismRating?: number
  attitudeRating?: number
  problemResolutionRating?: number
  comment?: string
  isSolved: boolean
  wouldRecommend: boolean
  improvementSuggestion?: string
  createdAt: string
}
