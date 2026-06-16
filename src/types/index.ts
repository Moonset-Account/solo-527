export interface Product {
  id: string
  name: string
  category: string
  brand: string
  specification: string
  unit: string
  currentStock: number
  minStock: number
  maxStock: number
  unitPrice: number
  costPrice: number
  location: string
  status: 'normal' | 'low' | 'out' | 'overstock'
  createdAt: string
  updatedAt: string
}

export interface StockMovement {
  id: string
  productId: string
  productName: string
  type: 'in' | 'out' | 'damage' | 'return'
  quantity: number
  beforeStock: number
  afterStock: number
  operator: string
  reason: string
  relatedId?: string
  createdAt: string
}

export interface Appointment {
  id: string
  customerName: string
  customerPhone: string
  consultantName: string
  appointmentDate: string
  appointmentTime: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  items: AppointmentItem[]
  totalAmount: number
  notes: string
  createdAt: string
  updatedAt: string
}

export interface AppointmentItem {
  id: string
  appointmentId: string
  serviceName: string
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface Consumption {
  id: string
  appointmentId: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalAmount: number
  consultantName: string
  customerName: string
  consumedAt: string
  isAnomaly: boolean
  anomalyReason?: string
}

export interface Evaluation {
  id: string
  appointmentId: string
  customerName: string
  rating: number
  content: string
  tags: string[]
  createdAt: string
  reminderSent: boolean
}

export interface Reminder {
  id: string
  type: 'evaluation' | 'restock' | 'appointment' | 'anomaly'
  title: string
  content: string
  severity: 'low' | 'medium' | 'high'
  isRead: boolean
  relatedId?: string
  createdAt: string
  actionUrl?: string
}

export interface ReminderRule {
  id: string
  name: string
  type: 'evaluation' | 'restock' | 'appointment' | 'anomaly'
  condition: string
  conditionValue: string | number
  action: string
  isEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface RestockAlert {
  id: string
  productId: string
  productName: string
  currentStock: number
  minStock: number
  suggestedQuantity: number
  estimatedCost: number
  supplier: string
  status: 'pending' | 'ordered' | 'received' | 'ignored'
  createdAt: string
}

export interface Attachment {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  url: string
  uploadedBy: string
  uploadedAt: string
  relatedType?: string
  relatedId?: string
}

export interface ChangeLog {
  id: string
  entityType: string
  entityId: string
  field: string
  oldValue: string
  newValue: string
  changedBy: string
  changedAt: string
}

export interface ConsultantCommission {
  id: string
  consultantName: string
  month: string
  totalAppointments: number
  totalRevenue: number
  commissionRate: number
  commissionAmount: number
  topServices: string[]
}

export interface ServicePriceAnalysis {
  id: string
  serviceName: string
  category: string
  sellingPrice: number
  costPrice: number
  profitMargin: number
  monthlyUsage: number
  trend: 'up' | 'down' | 'stable'
}

export interface ConsumptionRanking {
  id: string
  productName: string
  category: string
  totalConsumed: number
  totalAmount: number
  usageCount: number
  rank: number
}

export interface DashboardData {
  totalProducts: number
  lowStockCount: number
  todayAppointments: number
  todayRevenue: number
  pendingReminders: number
  anomalyCount: number
  visitRate: number
  consumptionTrend7d: { date: string; amount: number }[]
  consumptionTrend30d: { date: string; amount: number }[]
}

export interface User {
  id: string
  username: string
  displayName: string
  role: 'admin' | 'manager' | 'staff'
  avatar?: string
  token?: string
}
