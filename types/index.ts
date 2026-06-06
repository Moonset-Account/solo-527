export enum UserRole {
  GRID_MEMBER = 'grid_member',
  PROPERTY = 'property',
  STREET_ADMIN = 'street_admin',
  PUBLIC = 'public'
}

export interface User {
  id: string
  username: string
  name: string
  phone: string
  role: UserRole
  community?: string
  gridArea?: string
  propertyCompany?: string
}

export enum TaskType {
  MISSED_SORT = 'missed_sort',
  BIN_FULL = 'bin_full',
  POINT_DAMAGED = 'point_damaged'
}

export enum TaskStatus {
  SUBMITTED = 'submitted',
  CLAIMED = 'claimed',
  IN_PROGRESS = 'in_progress',
  PENDING_REVIEW = 'pending_review',
  REJECTED = 'rejected',
  CLOSED = 'closed',
  ESCALATED = 'escalated',
  CANCELLED = 'cancelled'
}

export interface Photo {
  url: string
  uploadedAt: string
  uploadedBy: string
  caption?: string
}

export interface ReviewRecord {
  reviewerId: string
  reviewerName: string
  result: 'pass' | 'fail'
  reason?: string
  photos: Photo[]
  reviewedAt: string
}

export interface HistoryRecord {
  status: TaskStatus
  changedBy: string
  changedByName: string
  changedAt: string
  note?: string
}

export interface Point {
  _id: string
  name: string
  address: string
  community: string
  location: {
    type: string
    coordinates: number[]
  }
  binTypes: string[]
  propertyCompany: string
  contactPerson: string
  contactPhone: string
  status: 'active' | 'inactive' | 'maintenance'
  createdAt: string
  updatedAt: string
}

export interface Task {
  _id: string
  taskNumber: string
  type: TaskType
  pointId: string | Point
  pointName: string
  community: string
  submitterId: string
  submitterName: string
  description: string
  beforePhotos: Photo[]
  afterPhotos: Photo[]
  status: TaskStatus
  propertyCompany: string
  assigneeId?: string
  assigneeName?: string
  deadline: string
  isEscalated: boolean
  escalationReason?: string
  escalationTime?: string
  reviewRecords: ReviewRecord[]
  history: HistoryRecord[]
  rejectReason?: string
  createdAt: string
  updatedAt: string
}

export const TaskTypeLabels: Record<TaskType, string> = {
  [TaskType.MISSED_SORT]: '误投',
  [TaskType.BIN_FULL]: '桶满',
  [TaskType.POINT_DAMAGED]: '点位破损'
}

export const TaskStatusLabels: Record<TaskStatus, string> = {
  [TaskStatus.SUBMITTED]: '待认领',
  [TaskStatus.CLAIMED]: '已认领',
  [TaskStatus.IN_PROGRESS]: '整改中',
  [TaskStatus.PENDING_REVIEW]: '待复查',
  [TaskStatus.REJECTED]: '复查不通过',
  [TaskStatus.CLOSED]: '已关闭',
  [TaskStatus.ESCALATED]: '已升级',
  [TaskStatus.CANCELLED]: '已撤回'
}

export const TaskStatusColors: Record<TaskStatus, string> = {
  [TaskStatus.SUBMITTED]: 'blue',
  [TaskStatus.CLAIMED]: 'cyan',
  [TaskStatus.IN_PROGRESS]: 'yellow',
  [TaskStatus.PENDING_REVIEW]: 'orange',
  [TaskStatus.REJECTED]: 'red',
  [TaskStatus.CLOSED]: 'green',
  [TaskStatus.ESCALATED]: 'rose',
  [TaskStatus.CANCELLED]: 'gray'
}
