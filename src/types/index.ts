export type UserRole = 'pm' | 'admin'

export type UserStatus = 'active' | 'disabled'

export type ItemStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'archived'

export type ItemPriority = 'low' | 'medium' | 'high' | 'urgent'

export type ReviewConclusion = 'completed' | 'partial' | 'incomplete' | 'escalated'

export type LogType = 'claim' | 'progress' | 'review' | 'config_change' | 'overdue_mark' | 'user_action'

export type RefType = 'item' | 'config'

export interface User {
  _id: string
  username: string
  name: string
  role: UserRole
  department: string | Department
  status: UserStatus
  createdAt: string
  updatedAt: string
}

export interface Department {
  _id: string
  name: string
  head: string | User
  createdAt: string
  updatedAt: string
}

export interface Item {
  _id: string
  title: string
  description: string
  status: ItemStatus
  priority: ItemPriority
  department: string | Department
  assignee: string | User
  deadline: string
  claimedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Progress {
  _id: string
  itemId: string | Item
  content: string
  attachments: string[]
  operator: string | User
  createdAt: string
}

export interface Review {
  _id: string
  itemId: string | Item
  conclusion: ReviewConclusion
  remark: string
  operator: string | User
  createdAt: string
  updatedAt: string
}

export interface Attachment {
  _id: string
  filename: string
  url: string
  version: number
  refId: string
  refType: RefType
  operator: string | User
  createdAt: string
}

export interface Config {
  _id: string
  type: string
  key: string
  value: any
  createdAt: string
  updatedAt: string
}

export interface LogDetail {
  field: string
  oldValue: any
  newValue: any
}

export interface Log {
  _id: string
  type: LogType
  operator: string | User
  targetId: string
  detail: LogDetail
  createdAt: string
}

export interface PaginatedResponse<T = any> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages?: number
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export interface ReviewStatistics {
  departmentStats: Array<{ name: string; count: number; completed: number; overdue: number }>
  overdueTrend: Array<{ period: string; total: number; overdue: number }>
}

export interface PaginationParams {
  page?: number
  pageSize?: number
  [key: string]: any
}
