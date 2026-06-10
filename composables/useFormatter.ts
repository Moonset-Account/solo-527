export function useFormatter() {
  const formatDate = (date: string | Date | null | undefined, format: string = 'YYYY-MM-DD HH:mm:ss') => {
    if (!date) return '-'
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return '-'

    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')

    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds)
  }

  const formatDateOnly = (date: string | Date | null | undefined) => {
    return formatDate(date, 'YYYY-MM-DD')
  }

  const formatTimeOnly = (date: string | Date | null | undefined) => {
    return formatDate(date, 'HH:mm:ss')
  }

  const formatMoney = (amount: string | number | null | undefined) => {
    if (amount === null || amount === undefined) return '-'
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(num)) return '-'
    return `¥${num.toFixed(2)}`
  }

  const formatDuration = (minutes: number | null | undefined) => {
    if (!minutes) return '-'
    if (minutes < 60) return `${minutes}分钟`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
  }

  const formatDistance = (meters: number | null | undefined) => {
    if (!meters) return '-'
    if (meters < 1000) return `${meters}米`
    return `${(meters / 1000).toFixed(2)}公里`
  }

  const relativeTime = (date: string | Date | null | undefined) => {
    if (!date) return '-'
    const d = typeof date === 'string' ? new Date(date) : date
    const diff = Date.now() - d.getTime()

    const minute = 60 * 1000
    const hour = 60 * minute
    const day = 24 * hour

    if (diff < minute) return '刚刚'
    if (diff < hour) return `${Math.floor(diff / minute)}分钟前`
    if (diff < day) return `${Math.floor(diff / hour)}小时前`
    if (diff < 30 * day) return `${Math.floor(diff / day)}天前`
    return formatDateOnly(d)
  }

  return {
    formatDate,
    formatDateOnly,
    formatTimeOnly,
    formatMoney,
    formatDuration,
    formatDistance,
    relativeTime,
  }
}
