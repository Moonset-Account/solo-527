export type LeadStatus = 'new' | 'contacted' | 'measured' | 'quoted' | 'contracted' | 'lost'

export interface User {
  id: string
  username: string
  name: string
  role: string
  department: string
  permissions: string[]
}

export interface Lead {
  _id: string
  customerName: string
  phone: string
  source: string
  status: LeadStatus
  decorationDemand: {
    houseType?: string
    area?: number
    budgetRange?: string
    style?: string
    expectedStartDate?: string
  }
  measurementInfo: {
    measuredAt?: string
    measurer?: string
    actualArea?: number
    structureNote?: string
    photos?: string[]
  } | null
  assignedTo: any
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface LeadDisplay extends Lead {
  assignedToName: string
  lastFollowupDate?: string
  predictionScore?: number
}

export interface Followup {
  id: string
  leadId: string
  leadName: string
  type: string
  result: string
  scheduledDate: string
  completedDate?: string
  method: string
  assignee: string
  assigneeName: string
  nextFollowupDate?: string
  createdAt: string
}

export interface FollowupRule {
  id: string
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
  id: string
  leadId: string
  leadName: string
  score: number
  riskLevel: 'low' | 'medium' | 'high'
  factors: string[]
  lastUpdated: string
}

export interface ChurnRecord {
  id: string
  leadId: string
  leadName: string
  reason: string
  churnedAt: string
  riskIndicators: string[]
  suggestedAction: string
  daysSinceContact: number
  recallable: boolean
}

export interface Tag {
  id: string
  name: string
  color: string
  group: string
  enabled: boolean
  leadCount?: number
}

export interface DictItem {
  id: string
  category: string
  key: string
  label: string
  sort: number
  enabled: boolean
}

export interface ReminderTemplate {
  id: string
  name: string
  type: string
  channels: string[]
  scopePreview: string
  templateText: string
  variables: string[]
}

export interface ScopeConfig {
  id: string
  type: 'department' | 'role' | 'source'
  name: string
  values: string[]
}

export interface Contract {
  id: string
  leadId: string
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
  access_token: string
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
  id: string
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
