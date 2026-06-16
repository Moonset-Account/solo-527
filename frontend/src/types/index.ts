export interface LoginParams {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
}

export type UserRole = 'worker' | 'admin' | 'manager'

export enum EventStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PENDING_REVIEW = 'pending_review',
  PENDING_VISIT = 'pending_visit',
  COMPLETED = 'completed',
  REJECTED = 'rejected'
}

export enum EventCategory {
  ENVIRONMENT = 'environment',
  SECURITY = 'security',
  FACILITY = 'facility',
  CIVIL = 'civil',
  OTHER = 'other'
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  EXPIRED = 'expired'
}

export enum TodoType {
  EVENT = 'event',
  TASK = 'task',
  REVIEW = 'review',
  VISIT = 'visit'
}

export enum TodoStatus {
  PENDING = 'pending',
  COMPLETED = 'completed'
}

export interface User {
  id: number
  username: string
  nickname: string
  avatar: string
  phone: string
  roles: UserRole[]
  gridArea?: string
  createdAt: string
  updatedAt: string
}

export interface UserInfo {
  id: number
  username: string
  nickname: string
  avatar: string
  roles: UserRole[]
}

export interface GridEvent {
  id: number
  title: string
  description: string
  category: EventCategory
  status: EventStatus
  latitude: number
  longitude: number
  address: string
  images?: string[]
  reporterId: number
  reporterName: string
  handlerId?: number
  handlerName?: string
  createdAt: string
  updatedAt: string
}

export interface Resident {
  id: number
  name: string
  idCard: string
  phone: string
  gender: 'male' | 'female'
  birthDate: string
  address: string
  building: string
  unit: string
  room: string
  householdType: 'local' | 'migrant'
  specialType?: string
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface PatrolTask {
  id: number
  title: string
  description: string
  area: string
  assigneeId: number
  assigneeName: string
  status: TaskStatus
  startTime: string
  endTime: string
  completedTime?: string
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface RectificationReview {
  id: number
  eventId: number
  eventTitle: string
  reviewerId: number
  reviewerName: string
  result: 'pass' | 'fail'
  comment: string
  images?: string[]
  createdAt: string
}

export interface FollowUpVisit {
  id: number
  eventId: number
  eventTitle: string
  visitorId: number
  visitorName: string
  residentName: string
  residentPhone: string
  visitResult: string
  images?: string[]
  createdAt: string
}

export interface TodoItem {
  id: number
  type: TodoType
  title: string
  description: string
  refId: number
  status: TodoStatus
  priority: 'high' | 'medium' | 'low'
  deadline?: string
  userId: number
  createdAt: string
}

export interface EventStatusLog {
  id: number
  eventId: number
  fromStatus?: EventStatus
  toStatus: EventStatus
  operatorId: number
  operatorName: string
  remark?: string
  createdAt: string
}

export interface PageParams {
  page: number
  pageSize: number
  [key: string]: any
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface EventReportParams {
  title: string
  description: string
  category: EventCategory
  latitude: number
  longitude: number
  address: string
  images?: string[]
}

export interface ResidentFormData {
  name: string
  idCard: string
  phone: string
  gender: 'male' | 'female'
  birthDate: string
  address: string
  building: string
  unit: string
  room: string
  householdType: 'local' | 'migrant'
  specialType?: string
  remark?: string
}
