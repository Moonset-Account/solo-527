export const STATUS_FLOW: Record<string, string[]> = {
  NEW: ['ASSIGNED_LAWYER', 'ERROR'],
  ASSIGNED_LAWYER: ['LAWYER_REVIEWING', 'ERROR'],
  LAWYER_REVIEWING: ['LAWYER_COMPLETED', 'PENDING_RECTIFICATION', 'ERROR'],
  LAWYER_COMPLETED: ['ASSIGNED_REVIEWER', 'COMPLETED', 'ERROR'],
  ASSIGNED_REVIEWER: ['REVIEWER_REVIEWING', 'ERROR'],
  REVIEWER_REVIEWING: ['REVIEWER_COMPLETED', 'PENDING_RECTIFICATION', 'ERROR'],
  REVIEWER_COMPLETED: ['COMPLETED', 'PENDING_RECTIFICATION', 'ERROR'],
  PENDING_RECTIFICATION: ['RECTIFYING', 'ERROR'],
  RECTIFYING: ['ASSIGNED_LAWYER', 'ASSIGNED_REVIEWER', 'COMPLETED', 'ERROR'],
  COMPLETED: [],
  ERROR: ['NEW', 'ASSIGNED_LAWYER', 'ASSIGNED_REVIEWER', 'RECTIFYING']
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    NEW: '新建',
    ASSIGNED_LAWYER: '已分派律师',
    LAWYER_REVIEWING: '律师审阅中',
    LAWYER_COMPLETED: '律师审阅完成',
    ASSIGNED_REVIEWER: '已分派复核人',
    REVIEWER_REVIEWING: '复核人审阅中',
    REVIEWER_COMPLETED: '复核完成',
    PENDING_RECTIFICATION: '待整改',
    RECTIFYING: '整改中',
    COMPLETED: '已完成',
    ERROR: '异常'
  }
  return labels[status] || status
}

export function getStatusBadgeClass(status: string): string {
  const classes: Record<string, string> = {
    NEW: 'badge-new',
    ASSIGNED_LAWYER: 'badge-info',
    LAWYER_REVIEWING: 'badge-processing',
    LAWYER_COMPLETED: 'badge-info',
    ASSIGNED_REVIEWER: 'badge-info',
    REVIEWER_REVIEWING: 'badge-processing',
    REVIEWER_COMPLETED: 'badge-info',
    PENDING_RECTIFICATION: 'badge-warning',
    RECTIFYING: 'badge-warning',
    COMPLETED: 'badge-completed',
    ERROR: 'badge-error'
  }
  return classes[status] || 'badge-new'
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    LEGAL_MANAGER: '法务负责人',
    LAWYER: '律师',
    REVIEWER: '复核人',
    ADMIN: '系统管理员'
  }
  return labels[role] || role
}

export function getRoleBadgeClass(role: string): string {
  const classes: Record<string, string> = {
    LEGAL_MANAGER: 'badge-warning',
    LAWYER: 'badge-lawyer',
    REVIEWER: 'badge-reviewer',
    ADMIN: 'badge-info'
  }
  return classes[role] || 'badge-info'
}

export function getOpinionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    LAW_REVIEW: '法律意见',
    FINAL_REVIEW: '复核意见',
    RECTIFICATION: '整改说明',
    COMMENT: '备注'
  }
  return labels[type] || type
}

export function getLogActionLabel(action: string): string {
  const labels: Record<string, string> = {
    CREATE_CONTRACT: '创建合同',
    UPLOAD_VERSION: '上传版本',
    ASSIGN_LAWYER: '分派律师',
    ASSIGN_REVIEWER: '分派复核人',
    SUBMIT_OPINION: '提交意见',
    CHANGE_STATUS: '变更状态',
    DOWNLOAD: '下载文件',
    RECTIFY: '整改处理',
    COMPLETE: '完成审阅',
    ERROR: '异常处理',
    REMIND_SENT: '发送提醒'
  }
  return labels[action] || action
}

export function getGapSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    CRITICAL: '严重',
    HIGH: '高',
    MEDIUM: '中',
    LOW: '低'
  }
  return labels[severity] || severity
}

export function getGapSeverityClass(severity: string): string {
  const classes: Record<string, string> = {
    CRITICAL: 'badge-error',
    HIGH: 'badge-warning',
    MEDIUM: 'badge-processing',
    LOW: 'badge-info'
  }
  return classes[severity] || 'badge-info'
}

export function getGapStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    OPEN: '待处理',
    IN_PROGRESS: '处理中',
    RESOLVED: '已解决',
    CLOSED: '已关闭'
  }
  return labels[status] || status
}

export function getGapStatusClass(status: string): string {
  const classes: Record<string, string> = {
    OPEN: 'badge-error',
    IN_PROGRESS: 'badge-processing',
    RESOLVED: 'badge-completed',
    CLOSED: 'badge-info'
  }
  return classes[status] || 'badge-info'
}

export function formatDate(date: string | Date | null | undefined, showTime = true): string {
  if (!date) return '-'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return showTime ? `${y}-${m}-${day} ${h}:${min}` : `${y}-${m}-${day}`
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB'
}

export function formatAmount(amount: any, currency = 'CNY'): string {
  if (!amount && amount !== 0) return '-'
  const symbols: Record<string, string> = { CNY: '¥', USD: '$', EUR: '€' }
  const num = typeof amount === 'number' ? amount : Number(amount)
  return (symbols[currency] || '') + num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function daysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
}

export function daysFromNow(date: Date | string | null | undefined): number | null {
  if (!date) return null
  return daysBetween(new Date(), date)
}

export function isDeadlineNear(date: Date | string | null | undefined, days = 7): boolean {
  const d = daysFromNow(date)
  return d !== null && d >= 0 && d <= days
}

export function isDeadlineOverdue(date: Date | string | null | undefined): boolean {
  const d = daysFromNow(date)
  return d !== null && d < 0
}

export const CONTRACT_TYPES = [
  { value: '采购合同', label: '采购合同' },
  { value: '销售合同', label: '销售合同' },
  { value: '服务合同', label: '服务合同' },
  { value: '劳务合同', label: '劳务合同' },
  { value: '租赁合同', label: '租赁合同' },
  { value: '保密协议', label: '保密协议' },
  { value: '合作协议', label: '合作协议' },
  { value: '投资协议', label: '投资协议' },
  { value: '其他', label: '其他' }
]

export const PRIORITY_OPTIONS = [
  { value: 'URGENT', label: '紧急' },
  { value: 'HIGH', label: '高' },
  { value: 'NORMAL', label: '正常' },
  { value: 'LOW', label: '低' }
]

export const SEVERITY_OPTIONS = [
  { value: 'CRITICAL', label: '严重' },
  { value: 'HIGH', label: '高' },
  { value: 'MEDIUM', label: '中' },
  { value: 'LOW', label: '低' }
]

export const OPINION_TYPES = [
  { value: 'LAW_REVIEW', label: '法律意见' },
  { value: 'FINAL_REVIEW', label: '复核意见' },
  { value: 'RECTIFICATION', label: '整改说明' },
  { value: 'COMMENT', label: '备注' }
]
