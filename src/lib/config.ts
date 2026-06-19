import type { RiskLevel, ReconciliationStatus, PaymentStatus, DiscrepancyStatus, AgreementStatus, RequirementStatus, QuoteStatus, UserRole } from '@prisma/client'

export const riskLevelConfig: Record<RiskLevel, { label: string; className: string }> = {
  LOW: { label: '低', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  MEDIUM: { label: '中', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  HIGH: { label: '高', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  CRITICAL: { label: '严重', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

export const reconciliationStatusConfig: Record<ReconciliationStatus, { label: string; className: string }> = {
  PENDING: { label: '待处理', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  MATCHED: { label: '已匹配', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  DISCREPANCY: { label: '有差异', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  RESOLVED: { label: '已解决', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
}

export const paymentStatusConfig: Record<PaymentStatus, { label: string; className: string }> = {
  PENDING: { label: '待建议', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  RECOMMENDED: { label: '建议中', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  APPROVED: { label: '已批准', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  PAID: { label: '已支付', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  DISPUTED: { label: '有争议', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

export const discrepancyStatusConfig: Record<DiscrepancyStatus, { label: string; className: string }> = {
  OPEN: { label: '待处理', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  INVESTIGATING: { label: '调查中', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  CONFIRMED: { label: '已确认', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  RESOLVED: { label: '已解决', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  CLOSED: { label: '已关闭', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
}

export const agreementStatusConfig: Record<AgreementStatus, { label: string; className: string }> = {
  DRAFT: { label: '草稿', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  ACTIVE: { label: '生效中', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  EXPIRED: { label: '已过期', className: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' },
  TERMINATED: { label: '已终止', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

export const requirementStatusConfig: Record<RequirementStatus, { label: string; className: string }> = {
  DRAFT: { label: '草稿', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  SUBMITTED: { label: '已提交', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  APPROVED: { label: '已批准', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  FULFILLED: { label: '已完成', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  CANCELLED: { label: '已取消', className: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' },
}

export const quoteStatusConfig: Record<QuoteStatus, { label: string; className: string }> = {
  DRAFT: { label: '草稿', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  SUBMITTED: { label: '已提交', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  ACCEPTED: { label: '已接受', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  REJECTED: { label: '已拒绝', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  EXPIRED: { label: '已过期', className: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' },
}

export const userRoleConfig: Record<UserRole, { label: string; className: string }> = {
  EMPLOYEE: { label: '普通员工', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  PROCUREMENT_MANAGER: { label: '采购经理', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  SUPPLIER_COORDINATOR: { label: '供应商协同员', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  APPROVER: { label: '审批负责人', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  ADMIN: { label: '系统管理员', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

export const discrepancyTypeLabels: Record<string, string> = {
  QUANTITY: '数量差异',
  QUALITY: '质量问题',
  PRICE: '价格差异',
  DELIVERY_DATE: '交货期差异',
  SPECIFICATION: '规格不符',
}

export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '-'
  const num = typeof value === 'string' ? parseFloat(value) : value
  return `¥${num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function formatDecimal(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '-'
  const num = typeof value === 'string' ? parseFloat(value) : value
  return num.toLocaleString('zh-CN', { maximumFractionDigits: 4 })
}
