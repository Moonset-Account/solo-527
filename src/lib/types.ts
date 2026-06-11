import {
  TopicStatus,
  ScriptStatus,
  MaterialType,
  MaterialAccessLevel,
  AnomalyType,
  AnomalyStatus,
  ExportStatus,
  ExportFormat,
  TodoType,
  TodoStatus,
  UserRole,
} from '@prisma/client'

export type {
  TopicStatus,
  ScriptStatus,
  MaterialType,
  MaterialAccessLevel,
  AnomalyType,
  AnomalyStatus,
  ExportStatus,
  ExportFormat,
  TodoType,
  TodoStatus,
  UserRole,
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface PaginationResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface CreateTopicInput {
  title: string
  description: string
  tags: string[]
  priority?: number
  scheduledDate?: string
  deadline?: string
  assigneeId?: string
}

export interface UpdateTopicInput {
  title?: string
  description?: string
  tags?: string[]
  priority?: number
  status?: TopicStatus
  scheduledDate?: string
  deadline?: string
  assigneeId?: string
}

export interface CreateScriptInput {
  topicId: string
  version?: string
  content: string
  duration?: number
  assigneeId?: string
}

export interface UpdateScriptInput {
  content?: string
  version?: string
  duration?: number
  status?: ScriptStatus
  assigneeId?: string
  reviewOpinion?: string
  readingFeedback?: string
}

export interface CreateMaterialInput {
  name: string
  type: MaterialType
  url: string
  thumbnailUrl?: string
  fileSize?: number
  mimeType?: string
  tags: string[]
  permission?: MaterialAccessLevel
  topicId?: string
  scriptId?: string
}

export interface CreateTodoInput {
  type: TodoType
  title: string
  description?: string
  priority?: number
  dueDate?: string
  topicId?: string
  scriptId?: string
  coverVersionId?: string
  assigneeId: string
  readFeedback?: string
  reviewOpinion?: string
}

export interface CreateAnomalyInput {
  type: AnomalyType
  title: string
  description: string
  topicId?: string
  scriptId?: string
  conflictDetails?: any
}

export interface CloseAnomalyInput {
  closeReason: string
  closeResult: string
}

export interface CreateExportInput {
  name: string
  description?: string
  format: ExportFormat
  filters?: any
}

export interface ProductionFilterParams {
  startDate?: string
  endDate?: string
  userId?: string
  contentType?: string
  minQuality?: number
  maxQuality?: number
}
