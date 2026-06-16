import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

export function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return ''
  return dayjs(date).format(format)
}

export function formatDateTime(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return ''
  return dayjs(date).format(format)
}

export function formatRelativeTime(date) {
  if (!date) return ''
  const now = dayjs()
  const target = dayjs(date)
  const diffDays = now.diff(target, 'day')

  if (diffDays === 0) {
    const diffHours = now.diff(target, 'hour')
    if (diffHours === 0) {
      const diffMinutes = now.diff(target, 'minute')
      if (diffMinutes === 0) return '刚刚'
      return `${diffMinutes}分钟前`
    }
    return `${diffHours}小时前`
  } else if (diffDays === 1) {
    return '昨天'
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  }
  return formatDate(date)
}

export function formatMoney(amount, currency = 'CNY') {
  if (amount === null || amount === undefined || isNaN(amount)) return '-'
  const symbols = { CNY: '¥', USD: '$', EUR: '€' }
  const symbol = symbols[currency] || ''
  return symbol + Number(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export function formatNumber(num, decimals = 0) {
  if (num === null || num === undefined || isNaN(num)) return '-'
  return Number(num).toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

export function formatPercent(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return '-'
  return (Number(value) * 100).toFixed(decimals) + '%'
}

export function truncateText(text, maxLength = 50) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function getStatusText(status) {
  const statusMap = {
    draft: '草稿',
    pending: '待复核',
    approved: '已通过',
    rejected: '已驳回',
    sent: '已发送',
    active: '启用',
    inactive: '停用'
  }
  return statusMap[status] || status
}

export function getStatusType(status) {
  const typeMap = {
    draft: 'info',
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    sent: 'success',
    active: 'success',
    inactive: 'info'
  }
  return typeMap[status] || 'info'
}

export default {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatMoney,
  formatNumber,
  formatPercent,
  truncateText,
  getStatusText,
  getStatusType
}
