import dayjs from 'dayjs'
import type { ProcessRecordType } from '@/types'

export const formatDate = (date: string | Date | number, format = 'YYYY-MM-DD HH:mm:ss'): string => {
  if (!date) return '-'
  return dayjs(date).format(format)
}

export const formatDateOnly = (date: string | Date | number): string => {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD')
}

export const formatMoney = (amount: number): string => {
  if (amount === undefined || amount === null) return '-'
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: '待处理',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消',
    processing: '处理中',
    resolved: '已解决',
    pass: '通过',
    fail: '不通过',
    draft: '草稿',
    submitted: '已提交',
    approved: '已通过',
    rejected: '已驳回',
    signed: '已签订',
    terminated: '已终止',
    delayed: '已延期'
  }
  return statusMap[status] || status
}

export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    pending: 'gold',
    in_progress: 'blue',
    completed: 'green',
    cancelled: 'red',
    processing: 'orange',
    resolved: 'green',
    pass: 'green',
    fail: 'red',
    draft: 'default',
    submitted: 'blue',
    approved: 'green',
    rejected: 'red',
    signed: 'green',
    terminated: 'red',
    delayed: 'orange'
  }
  return colorMap[status] || 'default'
}

export const getProcessRecordTypeText = (type: ProcessRecordType): string => {
  const typeMap: Record<ProcessRecordType, string> = {
    design: '装修方案',
    contract: '合同',
    survey: '量房',
    inspection: '巡检',
    aftersales: '售后报修',
    construction: '施工阶段'
  }
  return typeMap[type] || type
}

export const getProcessRecordTypeColor = (type: ProcessRecordType): string => {
  const colorMap: Record<ProcessRecordType, string> = {
    design: 'blue',
    contract: 'purple',
    survey: 'cyan',
    inspection: 'orange',
    aftersales: 'red',
    construction: 'green'
  }
  return colorMap[type] || 'default'
}

export const getAfterSalesTypeText = (type: string): string => {
  const typeMap: Record<string, string> = {
    quality: '质量问题',
    installation: '安装问题',
    material: '材料问题',
    other: '其他'
  }
  return typeMap[type] || type
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
