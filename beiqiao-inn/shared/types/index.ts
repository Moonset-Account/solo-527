export type { RoomStatus, SyncStatus, UserRole, OrderStatus, TodoType, Priority, TodoStatus, ReviewStatus, CleaningStatus } from '@prisma/client'

export interface RoomInventoryDTO {
  id: number
  roomId: number
  date: string
  availableCount: number
  totalCount: number
  price: number
  syncStatus: string
  lastSyncedAt: string | null
}

export interface DashboardStats {
  totalRooms: number
  availableRooms: number
  occupancyRate: number
  vacancyRate: number
  pendingTodos: number
  p0Reminders: number
  todayCheckIns: number
  todayCheckOuts: number
  vacancyTrend: { date: string; rate: number }[]
}

export interface ReminderCondition {
  field: 'availableCount' | 'vacancyRate'
  operator: 'LT' | 'LTE' | 'GT' | 'GTE' | 'EQ'
  value: number
  timeWindow?: string
}

export interface ExportFilters {
  startDate: string
  endDate: string
  roomType?: string
  status?: string
  [key: string]: string | number | undefined
}
