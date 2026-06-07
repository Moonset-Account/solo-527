import dayjs from 'dayjs'

export function formatNumber(num: number, decimals = 0): string {
  if (num === null || num === undefined) return '-'
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatPercent(num: number, decimals = 1): string {
  if (num === null || num === undefined) return '-'
  return `${(num * 100).toFixed(decimals)}%`
}

export function formatDuration(seconds: number): string {
  if (seconds === null || seconds === undefined) return '-'
  if (seconds < 60) return `${Math.round(seconds)} 秒`
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  if (mins < 60) return `${mins} 分 ${secs} 秒`
  const hours = Math.floor(mins / 60)
  const remainMins = mins % 60
  return `${hours} 时 ${remainMins} 分`
}

export function formatDate(date: string | Date, format = 'YYYY-MM-DD'): string {
  if (!date) return '-'
  return dayjs(date).format(format)
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'YYYY-MM-DD HH:mm:ss')
}

export function formatRelativeTime(date: string | Date): string {
  const now = dayjs()
  const target = dayjs(date)
  const diffMinutes = now.diff(target, 'minute')
  if (diffMinutes < 1) return '刚刚'
  if (diffMinutes < 60) return `${diffMinutes} 分钟前`
  const diffHours = now.diff(target, 'hour')
  if (diffHours < 24) return `${diffHours} 小时前`
  const diffDays = now.diff(target, 'day')
  if (diffDays < 7) return `${diffDays} 天前`
  return formatDate(date)
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
