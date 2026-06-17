import dayjs from 'dayjs'

export function formatDate(date: string | Date, format: string = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return ''
  return dayjs(date).format(format)
}

export function formatDateTime(date: string | Date) {
  return formatDate(date, 'YYYY-MM-DD HH:mm')
}

export function formatDateOnly(date: string | Date) {
  return formatDate(date, 'YYYY-MM-DD')
}

export function formatTimeOnly(date: string | Date) {
  return formatDate(date, 'HH:mm')
}

export function getRelativeTime(date: string | Date) {
  const now = dayjs()
  const target = dayjs(date)
  const diff = now.diff(target, 'minute')
  
  if (diff < 1) return '刚刚'
  if (diff < 60) return `${diff}分钟前`
  if (diff < 1440) return `${Math.floor(diff / 60)}小时前`
  if (diff < 43200) return `${Math.floor(diff / 1440)}天前`
  
  return formatDateOnly(date)
}
