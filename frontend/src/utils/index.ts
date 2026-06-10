import dayjs from 'dayjs'
import type {
  ProcessRecordType,
  FeedbackType,
  AfterSalesType
} from '@/types'

export const formatDate = (date: string | Date | number, format = 'YYYY-MM-DD HH:mm:ss'): string => {
  if (!date) return '-'
  return dayjs(date).format(format)
}

export const formatDateOnly = (date: string | Date | number): string => {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD')
}

export const formatMoney = (amount: number | string): string => {
  if (amount === undefined || amount === null) return '-'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return `¥${num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    PENDING: '待处理',
    DESIGNING: '设计中',
    CONSTRUCTING: '施工中',
    COMPLETED: '已完成',
    DELAYED: '已延期',
    IN_PROGRESS: '进行中',
    DRAFT: '草稿',
    SUBMITTED: '已提交',
    APPROVED: '已通过',
    REJECTED: '已驳回',
    SIGNED: '已签订',
    TERMINATED: '已终止',
    PROCESSED: '已处理',
    RESOLVED: '已解决',
    PASS: '通过',
    FAIL: '不通过',
    PROCESSING: '处理中',
    CLOSED: '已关闭'
  }
  return statusMap[status] || status
}

export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    PENDING: 'gold',
    DESIGNING: 'blue',
    CONSTRUCTING: 'blue',
    IN_PROGRESS: 'blue',
    COMPLETED: 'green',
    DELAYED: 'orange',
    DRAFT: 'default',
    SUBMITTED: 'blue',
    APPROVED: 'green',
    REJECTED: 'red',
    SIGNED: 'green',
    TERMINATED: 'red',
    PROCESSED: 'green',
    RESOLVED: 'green',
    PASS: 'green',
    FAIL: 'red',
    PROCESSING: 'orange',
    CLOSED: 'default'
  }
  return colorMap[status] || 'default'
}

export const getFeedbackTypeText = (type: FeedbackType | string): string => {
  const typeMap: Record<string, string> = {
    COMPLAINT: '投诉',
    SUGGESTION: '建议',
    PRAISE: '表扬'
  }
  return typeMap[type] || type
}

export const getFeedbackTypeColor = (type: FeedbackType | string): string => {
  const colorMap: Record<string, string> = {
    COMPLAINT: 'red',
    SUGGESTION: 'blue',
    PRAISE: 'green'
  }
  return colorMap[type] || 'default'
}

export const getAfterSalesTypeText = (type: AfterSalesType | string): string => {
  const typeMap: Record<string, string> = {
    REPAIR: '维修',
    MAINTENANCE: '保养',
    CONSULT: '咨询'
  }
  return typeMap[type] || type
}

export const getAfterSalesTypeColor = (type: AfterSalesType | string): string => {
  const colorMap: Record<string, string> = {
    REPAIR: 'red',
    MAINTENANCE: 'orange',
    CONSULT: 'blue'
  }
  return colorMap[type] || 'default'
}

export const getProcessRecordTypeText = (type: ProcessRecordType | string): string => {
  const typeMap: Record<string, string> = {
    DESIGN: '装修方案',
    CONTRACT: '合同',
    SURVEY: '量房',
    INSPECTION: '巡检',
    AFTERSALES: '售后报修',
    CONSTRUCTION: '施工阶段'
  }
  return typeMap[type] || type
}

export const getProcessRecordTypeColor = (type: ProcessRecordType | string): string => {
  const colorMap: Record<string, string> = {
    DESIGN: 'blue',
    CONTRACT: 'purple',
    SURVEY: 'cyan',
    INSPECTION: 'orange',
    AFTERSALES: 'red',
    CONSTRUCTION: 'green'
  }
  return colorMap[type] || 'default'
}

export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}
