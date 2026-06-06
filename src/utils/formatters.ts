export function formatCurrency(value: number): string {
  if (value >= 100000000) {
    return `¥${(value / 100000000).toFixed(2)}亿`
  }
  if (value >= 10000) {
    return `¥${(value / 10000).toFixed(1)}万`
  }
  return `¥${value.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}`
}

export function formatNumber(value: number): string {
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(2)}亿`
  }
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万`
  }
  return value.toLocaleString('zh-CN', { maximumFractionDigits: 0 })
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function formatPercentSigned(value: number): string {
  const pct = (value * 100).toFixed(1)
  return value >= 0 ? `+${pct}%` : `${pct}%`
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

export function formatDateFull(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function getWeekdayLabel(day: number): string {
  const labels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return labels[day]
}

export function getTrendColor(value: number): string {
  if (value > 0) return 'text-green-600'
  if (value < 0) return 'text-red-600'
  return 'text-gray-500'
}

export function getTrendBgColor(value: number): string {
  if (value > 0) return 'bg-green-50 text-green-700'
  if (value < 0) return 'bg-red-50 text-red-700'
  return 'bg-gray-50 text-gray-600'
}
