export type ContractStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ABNORMAL_CLOSED'
export type NodeStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'TIMEOUT'
export type RemindType = 'SMS' | 'EMAIL' | 'SYSTEM'
export type ReplyStatus = 'PENDING' | 'REPLIED' | 'IGNORED'
export type MaterialStatus = 'MISSING' | 'SUBMITTED' | 'SUPPLEMENTING'

export interface Contract {
  id: number
  contractNo: string
  title: string
  applicant: string
  department: string
  status: ContractStatus
  isDuplicate: boolean
  duplicateAffectedObjects: string | null
  duplicateHandler: string | null
  duplicateNextStep: string | null
  createdAt: string
  updatedAt: string
  approvalNodes?: ApprovalNode[]
  reminderRecords?: ReminderRecord[]
  materialItems?: MaterialItem[]
}

export interface ApprovalNode {
  id: number
  contractId: number
  nodeName: string
  assignee: string
  assigneeDepartment: string
  status: NodeStatus
  timeoutMinutes: number
  elapsedMinutes: number
  startedAt: string
  completedAt: string | null
}

export interface ReminderRecord {
  id: number
  contractId: number
  nodeId: number
  remindType: RemindType
  remindContent: string
  remindBy: string
  remindTo: string
  replyStatus: ReplyStatus
  createdAt: string
}

export interface MaterialItem {
  id: number
  contractId: number
  materialName: string
  status: MaterialStatus
  requiredBy: string
  submittedAt: string | null
  expectedAt: string | null
}

export interface StuckNode {
  contractId: number
  contractNo: string
  contractTitle: string
  contractStatus: ContractStatus
  nodeId: number
  nodeName: string
  assignee: string
  assigneeDepartment: string
  elapsedMinutes: number
  timeoutMinutes: number
  isOverdue: boolean
  startedAt: string
}

export interface CompletenessStats {
  total: number
  submitted: number
  missing: number
  supplementing: number
  rate: number
}

export interface DurationStats {
  nodeName: string
  avgMinutes: number
  p90Minutes: number
  count: number
}

export interface ReminderStats {
  assignee: string
  department: string
  count: number
}

export interface TimeoutRankItem {
  nodeName: string
  timeoutCount: number
  avgOverdueMinutes: number
}

export const CONTRACT_STATUS_MAP: Record<ContractStatus, string> = {
  PENDING: '待处理',
  IN_PROGRESS: '处理中',
  COMPLETED: '已完成',
  ABNORMAL_CLOSED: '异常关闭',
}

export const NODE_STATUS_MAP: Record<NodeStatus, string> = {
  PENDING: '待处理',
  PROCESSING: '处理中',
  COMPLETED: '已完成',
  TIMEOUT: '已超时',
}

export const MATERIAL_STATUS_MAP: Record<MaterialStatus, string> = {
  MISSING: '缺失',
  SUBMITTED: '已提交',
  SUPPLEMENTING: '补齐中',
}

export const REMIND_TYPE_MAP: Record<RemindType, string> = {
  SMS: '短信',
  EMAIL: '邮件',
  SYSTEM: '系统消息',
}

export const REPLY_STATUS_MAP: Record<ReplyStatus, string> = {
  PENDING: '待回复',
  REPLIED: '已回复',
  IGNORED: '已忽略',
}
