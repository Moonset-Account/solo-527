export { prisma } from '../plugins/prisma'

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

export function canTransition(from: string, to: string): boolean {
  const allowed = STATUS_FLOW[from]
  return allowed ? allowed.includes(to) : false
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

export function generateContractNo(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `HT-${year}${month}${day}-${random}`
}

export function hashPassword(password: string): string {
  return Buffer.from(password).toString('base64')
}

export function verifyPassword(password: string, hash: string): boolean {
  return Buffer.from(password).toString('base64') === hash
}
