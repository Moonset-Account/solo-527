export interface User {
  id: number
  username: string
  name: string
  role: string
  phone?: string
  email?: string
  avatar?: string
  createdAt?: string
  updatedAt?: string
}

export interface Vehicle {
  id: number
  plateNumber: string
  vin?: string
  brand: string
  model: string
  year: number
  color?: string
  mileage?: number
  ownerName: string
  ownerPhone: string
  ownerIdCard?: string
  lastMaintenanceDate?: string
  nextMaintenanceDate?: string
  remark?: string
  createdAt?: string
  updatedAt?: string
}

export interface InspectionItem {
  id: number
  name: string
  category: string
  standard?: string
  unit?: string
  sortOrder?: number
}

export interface InspectionTemplate {
  id: number
  name: string
  description?: string
  items: InspectionItem[]
  isDefault?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Part {
  id: number
  name: string
  code?: string
  category: string
  brand?: string
  model?: string
  unit: string
  costPrice: number
  salePrice: number
  stock: number
  minStock?: number
  remark?: string
  createdAt?: string
  updatedAt?: string
}

export interface Lead {
  id: number
  customerName: string
  customerPhone: string
  source: string
  intention: string
  status: 'pending' | 'assigned' | 'following' | 'converted' | 'lost'
  assigneeId?: number
  assigneeName?: string
  vehicleIntention?: string
  budget?: number
  remark?: string
  createdAt?: string
  updatedAt?: string
}

export interface Followup {
  id: number
  leadId: number
  customerName: string
  customerPhone: string
  type: string
  content: string
  result?: string
  nextFollowupDate?: string
  operatorId: number
  operatorName: string
  status: 'pending' | 'completed' | 'cancelled' | 'no_answer'
  appointmentStatus?: 'pending' | 'success' | 'failed'
  appointmentSuccess?: boolean
  appointmentDate?: string
  vehicleId?: number
  vehicleInfo?: string
  scheduledTime?: string
  createdAt?: string
  updatedAt?: string
}

export interface Appointment {
  id: number
  customerName: string
  customerPhone: string
  vehicleId?: number
  plateNumber?: string
  serviceType: string
  appointmentDate: string
  appointmentTime: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  remark?: string
  createdAt?: string
  updatedAt?: string
}

export interface QualityRecord {
  id: number
  workOrderId: number
  plateNumber: string
  serviceType: string
  technician: string
  inspector: string
  status: 'pending' | 'inspecting' | 'repairing' | 'completed' | 'exception' | 'passed' | 'failed' | 'repaired'
  inspectionItems?: { name: string; result: string; remark?: string }[]
  remark?: string
  createdAt?: string
  updatedAt?: string
}

export interface StatusTransition {
  id: number
  workOrderId: number
  fromStatus: string
  toStatus: string
  operator: string
  remark?: string
  createdAt?: string
}

export interface ExceptionRecord {
  id: number
  workOrderId?: number
  plateNumber?: string
  type: string
  description: string
  level: 'low' | 'medium' | 'high' | 'critical'
  reporter: string
  handler?: string
  status: 'pending' | 'processing' | 'resolved' | 'closed'
  solution?: string
  createdAt?: string
  updatedAt?: string
}

export interface Rule {
  id: number
  name: string
  code: string
  category: string
  description?: string
  enabled: boolean
  config?: Record<string, any>
  createdAt?: string
  updatedAt?: string
}

export interface RuleToggle {
  ruleCode: string
  enabled: boolean
}

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface PagedResponse<T = any> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  token: string
  user: User
}

export interface DashboardTodoItem {
  id: number
  type: 'followup' | 'appointment' | 'exception' | 'lead'
  title: string
  description: string
  time?: string
  priority?: 'low' | 'medium' | 'high'
  status: string
  redirectUrl: string
}

export interface DashboardData {
  todayFollowups: number
  pendingLeads: number
  pendingExceptions: number
  todayAppointments: number
  todayLeads: number
  pendingFollowups: number
  qualityPassRate: number
  weeklyTrend: { date: string; count: number }[]
  serviceDistribution: { name: string; value: number }[]
  todoList: DashboardTodoItem[]
  exceptionList: ExceptionRecord[]
}

export interface PaginationParams {
  page: number
  pageSize: number
  keyword?: string
  status?: string
  [key: string]: any
}
