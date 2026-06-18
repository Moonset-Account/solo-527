export type LeadStatus = 'new' | 'contacted' | 'measured' | 'quoted' | 'contracted' | 'lost'

export interface User {
  id: number
  username: string
  realName: string
  phone: string
  email: string
  role: string
  department: string
  avatar?: string
  permissions: string[]
}

export interface Lead {
  id: number
  customerName: string
  phone: string
  source: string
  status: LeadStatus
  assignedTo: number
  assignedToName: string
  budgetMin: number
  budgetMax: number
  style: string
  tags: Tag[]
  houseType: string
  area: number
  expectedStartDate: string
  measuredDate?: string
  measurer?: string
  actualArea?: number
  measureNotes?: string
  lastFollowupDate?: string
  nextFollowupDate?: string
  predictionScore?: number
  createdAt: string
  updatedAt: string
}

export interface Followup {
  id: number
  leadId: number
  leadName: string
  type: string
  result: string
  scheduledDate: string
  completedDate?: string
  method: string
  assignee: number
  assigneeName: string
  nextFollowupDate?: string
  createdAt: string
}

export interface FollowupRule {
  id: number
  name: string
  triggerEvent: string
  triggerParams: Record<string, unknown>
  actionRemindHours: number
  actionMethods: string[]
  actionTarget: string
  scopeDepartments: string[]
  scopeRoles: string[]
  scopeSources: string[]
  priority: number
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface Prediction {
  id: number
  leadId: number
  leadName: string
  score: number
  riskLevel: 'low' | 'medium' | 'high'
  factors: string[]
  lastUpdated: string
}

export interface ChurnRecord {
  id: number
  leadId: number
  leadName: string
  reason: string
  churnedAt: string
  riskIndicators: string[]
  suggestedAction: string
  daysSinceContact: number
  recallable: boolean
}

export interface Tag {
  id: number
  name: string
  color: string
  group: string
  enabled: boolean
  leadCount?: number
}

export interface DictItem {
  id: number
  category: string
  key: string
  label: string
  sort: number
  enabled: boolean
}

export interface ReminderTemplate {
  id: number
  name: string
  type: string
  channels: string[]
  scopePreview: string
  templateText: string
  variables: string[]
}

export interface ScopeConfig {
  id: number
  type: 'department' | 'role' | 'source'
  name: string
  values: string[]
}

export interface Contract {
  id: number
  leadId: number
  leadName: string
  amount: number
  status: string
  pendingReason?: string
  signedAt?: string
  createdAt: string
}

export interface LeadQualityReport {
  source: string
  count: number
  conversionRate: number
  avgScore: number
}

export interface ContractPendingReason {
  reason: string
  count: number
  details: Contract[]
}

export interface ProcessingTimeReport {
  stage: string
  avgHours: number
  overtimeRate: number
}

export interface PaginatedResponse<T> {
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

export interface FunnelData {
  stage: string
  count: number
  rate: number
}

export interface ChurnTrend {
  month: string
  churned: number
  total: number
  rate: number
}

export interface FollowupCalendarEvent {
  id: number
  date: string
  leadName: string
  type: string
  urgency: 'overdue' | 'today' | 'upcoming'
}

export interface PersonPerformance {
  personName: string
  leadsCount: number
  followupRate: number
  closeRate: number
  avgScore: number
}

export type TagQueryLogic = 'AND' | 'OR'

export interface FilterField {
  key: string
  label: string
  type: 'select' | 'dateRange'
  options?: { label: string; value: string | number }[]
}
