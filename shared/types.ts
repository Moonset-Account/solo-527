export interface User {
  id: number
  username: string
  password: string
  displayName: string
  role: string
  storeId: number
  createdAt: Date
}

export interface Store {
  id: number
  name: string
  address: string
}

export interface Alert {
  id: number
  title: string
  level: string
  source: string
  description?: string
  status: string
  confirmedBy?: number
  confirmedAt?: Date
  escalatedTo?: number
  escalatedAt?: Date
  dutyStaffId?: number
  ticketId?: number
  createdAt: Date
  resolvedAt?: Date
}

export interface AccountRequest {
  id: number
  accountType: string
  purpose: string
  urgency: string
  reason?: string
  status: string
  applicantId: number
  approverId?: number
  approvalNote?: string
  approvedAt?: Date
  dutyStaffId?: number
  createdAt: Date
  completedAt?: Date
}

export interface InspectionPlan {
  id: number
  name: string
  frequency: string
  assigneeId: number
  createdAt: Date
}

export interface InspectionTask {
  id: number
  planId: number
  status: string
  assigneeId: number
  result?: string
  note?: string
  executedAt?: Date
  scheduledDate: Date
  createdAt: Date
}

export interface DutySchedule {
  id: number
  staffId: number
  date: Date
  shift: string
  createdAt: Date
}

export interface ProcessRecord {
  id: number
  ticketType: string
  ticketId: number
  action: string
  note?: string
  operatorId: number
  duration?: number
  createdAt: Date
}

export interface AuditLog {
  id: number
  operatorId: number
  action: string
  entityType: string
  entityId: number
  detail?: string
  createdAt: Date
}

export interface ApiResponse<T> {
  data: T
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface ApiError {
  code: string
  message: string
  detail?: string
}
