import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.locale('zh-cn')
dayjs.extend(relativeTime)

export const formatNumber = (value: number, decimals = 0): string => {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value)
}

export const formatCurrency = (value: number, unit = '万元'): string => {
  return `${formatNumber(value, 2)} ${unit}`
}

export const formatPercent = (value: number, decimals = 1): string => {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}

export const formatDate = (date: string | Date, format = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format)
}

export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

export const fromNow = (date: string | Date): string => {
  return dayjs(date).fromNow()
}

export const getTimeRangeDates = (range: string, startDate?: string, endDate?: string) => {
  const now = dayjs()
  let start: dayjs.Dayjs
  let end: dayjs.Dayjs = now.endOf('day')

  switch (range) {
    case 'today':
      start = now.startOf('day')
      break
    case 'week':
      start = now.startOf('week')
      break
    case 'month':
      start = now.startOf('month')
      break
    case 'quarter':
      start = now.startOf('quarter')
      break
    case 'custom':
    default:
      start = startDate ? dayjs(startDate) : now.startOf('month')
      end = endDate ? dayjs(endDate) : now.endOf('day')
      break
  }

  return {
    start: start.format('YYYY-MM-DD'),
    end: end.format('YYYY-MM-DD')
  }
}

export const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 7) return phone
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

export const maskName = (name: string): string => {
  if (!name || name.length <= 1) return name
  return name[0] + '*'.repeat(name.length - 1)
}

export const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email
  const [username, domain] = email.split('@')
  if (username.length <= 2) return username + '***@' + domain
  return username.slice(0, 2) + '***@' + domain
}

export const maskAmount = (amount: number): string => {
  const rounded = Math.round(amount / 10000) * 10000
  return formatNumber(rounded)
}

export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'high':
      return 'danger'
    case 'medium':
      return 'warning'
    case 'low':
      return 'success'
    default:
      return 'secondary'
  }
}

export const getPriorityText = (priority: string): string => {
  switch (priority) {
    case 'high':
      return '高'
    case 'medium':
      return '中'
    case 'low':
      return '低'
    default:
      return priority
  }
}

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'processing':
      return 'primary'
    case 'closed':
    case 'done':
      return 'success'
    case 'rejected':
      return 'danger'
    default:
      return 'secondary'
  }
}

export const getStatusText = (status: string): string => {
  switch (status) {
    case 'pending':
      return '待处理'
    case 'processing':
      return '处理中'
    case 'closed':
    case 'done':
      return '已完成'
    case 'rejected':
      return '已驳回'
    case 'approved':
      return '已通过'
    default:
      return status
  }
}

export const getSourceText = (source: string): string => {
  switch (source) {
    case 'metric_monitor':
      return '指标监控'
    case 'api_error':
      return '接口错误'
    case 'manual':
      return '手动录入'
    default:
      return source
  }
}

export const generateId = (): string => {
  return 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
