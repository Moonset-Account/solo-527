export type UserRole = 'duty_staff' | 'project_pm' | 'admin'
export type RequirementStatus = 'draft' | 'pending' | 'in_progress' | 'overdue' | 'completed' | 'closed'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type CommentType = 'comment' | 'meeting_minute' | 'delay_reason'
export type ReminderType = 'urgent' | 'schedule' | 'auto_overdue'
export type ReminderStatus = 'pending' | 'sent' | 'acknowledged'

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Requirement {
  id: number
  title: string
  description: string
  status: RequirementStatus
  priority: Priority
  department: string
  deadline: string
  creatorId: number
  assigneeId: number | null
  creator?: User
  assignee?: User
  comments?: RequirementComment[]
  attachments?: RequirementAttachment[]
  notes?: RequirementNote[]
  histories?: RequirementHistory[]
  reminders?: Reminder[]
  createdAt: string
  updatedAt: string
}

export interface RequirementComment {
  id: number
  requirementId: number
  userId: number
  content: string
  type: CommentType
  user?: User
  createdAt: string
}

export interface RequirementAttachment {
  id: number
  requirementId: number
  fileName: string
  fileSize: number
  fileUrl: string
  uploadedBy: number
  isMissing: boolean
  user?: User
  createdAt: string
}

export interface RequirementNote {
  id: number
  requirementId: number
  userId: number
  content: string
  user?: User
  createdAt: string
}

export interface RequirementHistory {
  id: number
  requirementId: number
  userId: number
  field: string
  oldValue: string | null
  newValue: string | null
  user?: User
  createdAt: string
}

export interface Reminder {
  id: number
  requirementId: number
  type: ReminderType
  message: string
  remindAt: string
  status: ReminderStatus
  createdBy: number
  requirement?: Requirement
  creator?: User
  createdAt: string
  updatedAt: string
}

export interface Dictionary {
  id: number
  category: string
  key: string
  value: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ReminderThreshold {
  id: number
  name: string
  category: string
  daysBeforeDeadline: number
  reminderInterval: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface DefaultAssignee {
  id: number
  department: string
  requirementType: string
  userId: number
  user?: User
  createdAt: string
  updatedAt: string
}

export interface AuditLog {
  id: number
  userId: number
  action: string
  resource: string
  resourceId: number
  details: string
  user?: User
  createdAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  perPage: number
  lastPage: number
}

export interface RequirementFilter {
  status?: RequirementStatus
  priority?: Priority
  department?: string
  assigneeId?: number
  keyword?: string
  page?: number
  perPage?: number
}

export interface CreateRequirementRequest {
  title: string
  description: string
  priority: Priority
  department: string
  deadline: string
  assigneeId?: number | null
}

export interface CreateReminderRequest {
  requirementId: number
  type: ReminderType
  message: string
  remindAt: string
}
