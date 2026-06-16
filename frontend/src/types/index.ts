export interface LoginParams {
  username: string
  password: string
}

export type UserRole = 'worker' | 'admin' | 'manager'

export interface UserInfo {
  id: number
  username: string
  role: UserRole
  gridId?: number
  realName?: string
  phone?: string
}

export interface LoginResponse {
  token: string
  expiresAt: string
  user: UserInfo
}

export enum EventStatus {
  REPORTED = 'reported',
  ASSIGNED = 'assigned',
  PROCESSING = 'processing',
  REVIEWING = 'reviewing',
  FOLLOWING_UP = 'following_up',
  CLOSED = 'closed',
  ABNORMAL_CLOSED = 'abnormal_closed'
}

export enum EventType {
  ENVIRONMENTAL_HYGIENE = 'environmental_hygiene',
  SECURITY_ISSUE = 'security_issue',
  FACILITY_DAMAGE = 'facility_damage',
  DISPUTE_RESOLUTION = 'dispute_resolution',
  OTHER = 'other'
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

export enum TodoType {
  EVENT_PROCESS = 'event_process',
  PATROL = 'patrol',
  REVIEW = 'review',
  FOLLOW_UP = 'follow_up'
}

export interface GridEvent {
  id: number
  title: string
  description: string
  eventType: EventType
  locationLat: number
  locationLng: number
  locationAddress: string
  gridId: number
  gridName?: string
  reporterId: number
  reporterName?: string
  status: EventStatus
  priority: number
  sourceBillNo?: string
  closeReason?: string
  createdAt: string
  statusLogs?: EventStatusLog[]
}

export interface Resident {
  id: number
  name: string
  idCard: string
  phone?: string
  address?: string
  gridId: number
  gridName?: string
  householdType?: string
  tags?: string[]
  remark?: string
}

export interface PatrolTask {
  id: number
  gridId: number
  gridName?: string
  assigneeId: number
  assigneeName?: string
  title: string
  planDate: string
  status: TaskStatus
  relatedEventId?: number
  relatedEventTitle?: string
  remark?: string
  sourceBillNo?: string
}

export interface RectificationReview {
  id: number
  eventId: number
  eventTitle?: string
  reviewerId: number
  reviewerName?: string
  result: 'pass' | 'fail'
  remark?: string
  createdAt: string
  sourceBillNo?: string
}

export interface FollowUpVisit {
  id: number
  eventId: number
  eventTitle?: string
  visitorId: number
  visitorName?: string
  visitDate: string
  visitResult?: string
  visitorRemark?: string
  isCompleted: boolean
  createdAt: string
}

export interface TodoItem {
  id: number
  userId: number
  userName?: string
  type: TodoType
  relatedId: number
  title: string
  dueDate?: string
  isCompleted: boolean
  completedAt?: string
}

export interface EventStatusLog {
  id: number
  eventId: number
  fromStatus: EventStatus
  toStatus: EventStatus
  operatorId: number
  operatorName?: string
  remark?: string
  createdAt: string
}

export interface PageParams {
  pageIndex: number
  pageSize: number
  [key: string]: any
}

export interface PageResult<T> {
  items: T[]
  totalCount: number
  pageIndex: number
  pageSize: number
}

export interface EventReportParams {
  eventType: EventType
  locationLat: number
  locationLng: number
  locationAddress: string
  gridId: number
  priority: number
  sourceBillNo?: string
  title: string
  description: string
}

export interface ResidentFormData {
  name: string
  idCard: string
  phone?: string
  address?: string
  gridId: number
  householdType?: string
  tags?: string[]
  remark?: string
}

export interface DashboardReport {
  TotalResidents: number
  TotalPatrolTasks: number
  CompletedPatrolTasks: number
  PendingPatrolTasks: number
  PendingTodos: number
}

export interface EventStatusReportItem {
  status: string
  count: number
}

export interface ClosureReport {
  pendingVisitCount: number
  pendingVisitRate: number
}
