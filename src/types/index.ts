import type { Role, BillStatus, BillType, PaymentMethod, WorkOrderStatus, WorkOrderPriority, WorkOrderType, VisitorStatus } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      role: Role
    }
  }

  interface User {
    id: string
    email: string
    name?: string
    role: Role
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
  }
}

export interface BillSummary {
  id: string
  billNo: string
  type: BillType
  title: string
  amount: number
  paidAmount: number
  status: BillStatus
  dueDate: Date
  apartment: {
    unitNumber: string
    building: string
  }
}

export interface WorkOrderSummary {
  id: string
  orderNo: string
  type: WorkOrderType
  title: string
  priority: WorkOrderPriority
  status: WorkOrderStatus
  isOverdue: boolean
  apartment: {
    unitNumber: string
  }
  assignee?: {
    name: string | null
  }
  createdAt: Date
  expectedComplete?: Date
}

export interface PaymentRecord {
  id: string
  amount: number
  method: PaymentMethod
  paidAt: Date
  transactionNo?: string
  bill: {
    billNo: string
    title: string
  }
}

export interface VisitorSummary {
  id: string
  visitorName: string
  visitorPhone: string
  visitDate: Date
  visitStartTime: Date
  visitEndTime: Date
  purpose: string
  status: VisitorStatus
  apartment: {
    unitNumber: string
  }
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface BillingStats {
  totalBilled: number
  totalPaid: number
  totalPending: number
  totalOverdue: number
  monthlyData: {
    month: string
    billed: number
    paid: number
  }[]
}

export interface WorkOrderStats {
  total: number
  pending: number
  inProgress: number
  completed: number
  overdue: number
}
