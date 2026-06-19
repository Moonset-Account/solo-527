export function formatAmount(amount, digits = 2) {
  if (amount == null || isNaN(amount)) return '0.00'
  return Number(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  })
}

export function formatAmountWithPrefix(amount, prefix = '¥') {
  return prefix + formatAmount(amount)
}

export function formatDate(date, pattern = 'YYYY-MM-DD') {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  return pattern
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

export function formatDateTime(date) {
  return formatDate(date, 'YYYY-MM-DD HH:mm:ss')
}

export function formatPercent(value, digits = 2, multiply = true) {
  if (value == null || isNaN(value)) return '0%'
  const num = multiply ? Number(value) * 100 : Number(value)
  return num.toFixed(digits) + '%'
}

export function formatDuration(minutes) {
  if (minutes == null || isNaN(minutes) || minutes < 0) return '0分钟'
  const mins = Number(minutes)
  if (mins < 60) {
    return mins + '分钟'
  }
  const hours = Math.floor(mins / 60)
  const remainMins = mins % 60
  if (hours < 24) {
    return remainMins > 0 ? hours + '小时' + remainMins + '分钟' : hours + '小时'
  }
  const days = Math.floor(hours / 24)
  const remainHours = hours % 24
  if (remainHours > 0) {
    return remainMins > 0 ? days + '天' + remainHours + '小时' + remainMins + '分钟' : days + '天' + remainHours + '小时'
  }
  return remainMins > 0 ? days + '天' + remainMins + '分钟' : days + '天'
}

export function formatDurationFromSeconds(seconds) {
  if (seconds == null || isNaN(seconds) || seconds < 0) return '0秒'
  const secs = Math.floor(Number(seconds))
  if (secs < 60) {
    return secs + '秒'
  }
  return formatDuration(Math.floor(secs / 60))
}

export function formatFileSize(bytes) {
  if (bytes == null || isNaN(bytes) || bytes < 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = Number(bytes)
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return size.toFixed(unitIndex === 0 ? 0 : 2) + ' ' + units[unitIndex]
}

export function formatPhone(phone) {
  if (!phone) return ''
  const str = String(phone)
  if (str.length === 11) {
    return str.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3')
  }
  return str
}
