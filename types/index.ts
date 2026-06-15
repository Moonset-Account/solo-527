export enum Role {
  FRONT_DESK = 'FRONT_DESK',
  ADVISOR = 'ADVISOR',
  MANAGER = 'MANAGER',
  DIRECTOR = 'DIRECTOR',
}

export enum Gender {
  M = 'M',
  F = 'F',
  UNKNOWN = 'UNKNOWN',
}

export enum LeadQuality {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
}

export enum ReturnPlanType {
  FOLLOW_UP = 'FOLLOW_UP',
  REVISIT = 'REVISIT',
  QUOTATION = 'QUOTATION',
}

export enum ReturnPlanStatus {
  PENDING = 'PENDING',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

export enum QuotationStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  REJECTED = 'REJECTED',
}

export enum ApprovalType {
  LEVEL_UPGRADE = 'LEVEL_UPGRADE',
  TAG_ADD = 'TAG_ADD',
  ADVISOR_TRANSFER = 'ADVISOR_TRANSFER',
  QUOTATION_APPROVE = 'QUOTATION_APPROVE',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PARTIAL = 'PARTIAL',
}

export enum ApprovalItemResult {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export interface User {
  id: number
  username: string
  name: string
  role: Role
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface Advisor {
  id: number
  name: string
  userId?: number
  role: string
  active: boolean
  createdAt: string
  customerCount?: number
  totalConsumption?: number
}

export interface Tag {
  id: number
  name: string
  color: string
  active: boolean
  createdAt: string
  customerCount?: number
}

export interface CustomerLevel {
  id: number
  name: string
  threshold: string | number
  benefits?: string
  active: boolean
  createdAt: string
  customerCount?: number
}

export interface SourceChannel {
  id: number
  name: string
  category: string
  active: boolean
  createdAt: string
  customerCount?: number
}

export interface CustomerTag {
  customerId: number
  tagId: number
  assignedAt: string
  tag?: Tag
}

export interface Customer {
  id: number
  name: string
  phone: string
  gender: Gender
  age?: number
  leadQuality: LeadQuality
  consultIntent: string
  returnPreference?: string
  totalConsumption: string | number
  visitCount: number
  levelId?: number
  level?: CustomerLevel
  advisorId?: number
  advisor?: Advisor
  sourceChannelId: number
  sourceChannel?: SourceChannel
  tags?: CustomerTag[]
  createdAt: string
  updatedAt: string
}

export interface ConsultRecord {
  id: number
  customerId: number
  customer?: Customer
  content: string
  consultDate: string
  operatorId?: number
  operator?: User
  createdAt: string
}

export interface Consumption {
  id: number
  customerId: number
  customer?: Customer
  amount: string | number
  project: string
  consumeDate: string
  operatorId?: number
  operator?: User
  createdAt: string
}

export interface QuotationItem {
  id: number
  quotationId: number
  itemName: string
  price: string | number
  quantity: number
}

export interface ResponseNode {
  id: number
  quotationId: number
  nodeName: string
  ownerId: number
  owner?: Advisor
  dueAt: string
  doneAt?: string
  remark?: string
  createdAt: string
}

export interface Quotation {
  id: number
  customerId: number
  customer?: Customer
  advisorId: number
  advisor?: Advisor
  version: string
  totalAmount: string | number
  expireAt: string
  status: QuotationStatus
  expireReason?: string
  items?: QuotationItem[]
  responseNodes?: ResponseNode[]
  createdAt: string
  updatedAt: string
}

export interface ReturnPlan {
  id: number
  customerId: number
  customer?: Customer
  assigneeId: number
  assignee?: Advisor
  planDate: string
  planType: ReturnPlanType
  content: string
  status: ReturnPlanStatus
  resultNote?: string
  createdAt: string
}

export interface ChurnRecord {
  id: number
  customerId: number
  customer?: Customer
  reasonCode: string
  reasonDetail?: string
  quotationId?: number
  churnDate: string
  createdAt: string
}

export interface ApprovalItem {
  id: number
  approvalId: number
  targetId: number
  targetName: string
  result: ApprovalItemResult
  originalValue?: string
  newValue?: string
  failReason?: string
  createdAt: string
  updatedAt: string
}

export interface BatchApproval {
  id: number
  type: ApprovalType
  submitterId: number
  submitter?: User
  status: ApprovalStatus
  payload: Record<string, any>
  items?: ApprovalItem[]
  createdAt: string
  updatedAt: string
}

export interface ReturnTemplate {
  id: number
  name: string
  planType: ReturnPlanType
  content: string
  daysOffset: number
  active: boolean
  createdAt: string
}

export interface CustomerDetailVO extends Customer {
  tags: Tag[]
  level?: CustomerLevel
  advisor?: Advisor
  sourceChannel?: SourceChannel
  consultRecords: ConsultRecord[]
  consumptions: Consumption[]
  quotations: Quotation[]
  returnPlans: ReturnPlan[]
  churnRecord?: ChurnRecord
  totalConsumptionAmount: number
  avgConsumption: number
  lastVisitDate?: string
  churnDays?: number
  isHighValue: boolean
  isAtRisk: boolean
}

export interface ConversionReportVO {
  period: string
  totalLeads: number
  consultedCount: number
  consultedRate: number
  quotedCount: number
  quotedRate: number
  acceptedCount: number
  acceptedRate: number
  consumedCount: number
  consumedRate: number
  totalRevenue: number
  avgOrderValue: number
  churnCount: number
  churnRate: number
}

export interface ChannelReportVO {
  channelId: number
  channelName: string
  category: string
  customerCount: number
  convertedCount: number
  conversionRate: number
  totalRevenue: number
  avgCustomerValue: number
  cost?: number
  roi?: number
}

export interface AdvisorReportVO {
  advisorId: number
  advisorName: string
  role: string
  customerCount: number
  activeCustomerCount: number
  quotedCount: number
  acceptedCount: number
  conversionRate: number
  totalRevenue: number
  returnPlanDoneCount: number
  returnPlanTotalCount: number
  returnRate: number
  churnCount: number
  churnRate: number
}

export interface LeadQualityDistributionVO {
  quality: LeadQuality
  count: number
  percentage: number
  avgConsumption: number
  conversionRate: number
}

export interface BatchApprovalResultVO {
  approvalId: number
  type: ApprovalType
  typeName: string
  status: ApprovalStatus
  statusName: string
  submitterName: string
  submitTime: string
  totalCount: number
  successCount: number
  failedCount: number
  pendingCount: number
  successRate: number
  items: Array<{
    id: number
    targetId: number
    targetName: string
    result: ApprovalItemResult
    resultName: string
    originalValue?: string
    newValue?: string
    failReason?: string
  }>
}

export interface MonthlyTrendVO {
  month: string
  newCustomers: number
  activeCustomers: number
  revenue: number
  consumptionCount: number
  quotationCount: number
}

export interface DashboardStatsVO {
  totalCustomers: number
  todayNewCustomers: number
  monthNewCustomers: number
  totalRevenue: number
  monthRevenue: number
  todayRevenue: number
  pendingReturnPlans: number
  todayReturnPlans: number
  pendingApprovals: number
  churnCount: number
  churnRate: number
  avgConsumption: number
  highValueCustomers: number
}

export interface TagCustomerVO {
  tagId: number
  tagName: string
  color: string
  customerCount: number
  totalRevenue: number
  avgConsumption: number
  conversionRate: number
}

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp: number
}

export interface PaginationParams {
  page: number
  pageSize: number
  keyword?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  token: string
  user: User
}

export interface CustomerQueryParams extends PaginationParams {
  leadQuality?: LeadQuality
  levelId?: number
  advisorId?: number
  sourceChannelId?: number
  tagIds?: number[]
  gender?: Gender
  minAge?: number
  maxAge?: number
  minConsumption?: number
  maxConsumption?: number
  minVisitCount?: number
  maxVisitCount?: number
  startDate?: string
  endDate?: string
  isChurned?: boolean
}

export interface QuotationQueryParams extends PaginationParams {
  status?: QuotationStatus
  advisorId?: number
  customerId?: number
  startDate?: string
  endDate?: string
  minAmount?: number
  maxAmount?: number
}

export interface ReturnPlanQueryParams extends PaginationParams {
  status?: ReturnPlanStatus
  planType?: ReturnPlanType
  assigneeId?: number
  customerId?: number
  startDate?: string
  endDate?: string
}

export interface ApprovalQueryParams extends PaginationParams {
  type?: ApprovalType
  status?: ApprovalStatus
  submitterId?: number
  startDate?: string
  endDate?: string
}
