import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
  }).format(amount)
}

export function formatDate(date: string | Date, pattern: string = 'yyyy-MM-dd HH:mm'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, pattern, { locale: zhCN })
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: zhCN })
}

export function generateOrderNumber(): string {
  const now = new Date()
  const datePart = format(now, 'yyyyMMdd')
  const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${datePart}${randomPart}`
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    unpaid: 'bg-red-100 text-red-800',
    partial: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    refunded: 'bg-gray-100 text-gray-800',
    available: 'bg-green-100 text-green-800',
    in_use: 'bg-blue-100 text-blue-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
    damaged: 'bg-red-100 text-red-800',
    lost: 'bg-gray-100 text-gray-800',
    minor: 'bg-yellow-100 text-yellow-800',
    moderate: 'bg-orange-100 text-orange-800',
    severe: 'bg-red-100 text-red-800',
    total: 'bg-red-200 text-red-900',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getStatusText(status: string): string {
  const texts: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消',
    unpaid: '未付款',
    partial: '部分付款',
    paid: '已付款',
    refunded: '已退款',
    available: '可用',
    in_use: '使用中',
    maintenance: '维护中',
    damaged: '已损坏',
    lost: '已丢失',
    minor: '轻微',
    moderate: '中等',
    severe: '严重',
    total: '报废',
    customer: '客户',
    staff: '店员',
    admin: '管理员',
    camera: '相机',
    lighting: '灯光',
    accessory: '配件',
    other: '其他',
    charge: '收取',
    refund: '退还',
    adjustment: '调整',
  }
  return texts[status] || status
}

export function calculateDurationHours(start: string | Date, end: string | Date): number {
  const startDate = typeof start === 'string' ? parseISO(start) : start
  const endDate = typeof end === 'string' ? parseISO(end) : end
  return Math.max(0, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60))
}
