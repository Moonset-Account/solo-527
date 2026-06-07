import { format, startOfDay, addHours, isBefore, isAfter, differenceInMinutes } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const BUSINESS_DAY_START_HOUR = 6

export function getBusinessDay(date: Date): string {
  const adjusted = addHours(date, -BUSINESS_DAY_START_HOUR)
  return format(startOfDay(adjusted), 'yyyy-MM-dd')
}

export function calculateBusinessDuration(arrival: Date, departure: Date): {
  durationMinutes: number
  isOvernight: boolean
  businessDays: string[]
} {
  const arrivalBusinessDay = getBusinessDay(arrival)
  const departureBusinessDay = getBusinessDay(departure)
  const isOvernight = arrivalBusinessDay !== departureBusinessDay
  
  const businessDays: string[] = []
  let current = new Date(arrivalBusinessDay)
  const end = new Date(departureBusinessDay)
  while (current <= end) {
    businessDays.push(format(current, 'yyyy-MM-dd'))
    current = addHours(current, 24)
  }

  const durationMinutes = differenceInMinutes(departure, arrival)

  return { durationMinutes, isOvernight, businessDays }
}

export function shouldAttributeToTeam(delayCategory: string): boolean {
  return delayCategory !== 'vehicle' && delayCategory !== 'weather'
}

export function getDelayColor(durationMinutes: number, threshold = { normal: 30, warning: 60, danger: 120 }): string {
  if (durationMinutes <= threshold.normal) return '#10b981'
  if (durationMinutes <= threshold.warning) return '#f59e0b'
  if (durationMinutes <= threshold.danger) return '#ef4444'
  return '#7c2d12'
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), 'yyyy-MM-dd HH:mm', { locale: zhCN })
}

export function getWeatherLabel(condition: string): { label: string; icon: string; color: string } {
  const map: Record<string, { label: string; icon: string; color: string }> = {
    sunny: { label: '晴', icon: '☀️', color: 'text-yellow-500' },
    cloudy: { label: '多云', icon: '⛅', color: 'text-gray-500' },
    rain: { label: '雨', icon: '🌧️', color: 'text-blue-500' },
    snow: { label: '雪', icon: '❄️', color: 'text-blue-300' },
    fog: { label: '雾', icon: '🌫️', color: 'text-gray-400' },
    storm: { label: '暴雨', icon: '⛈️', color: 'text-purple-500' },
  }
  return map[condition] || { label: condition, icon: '❓', color: 'text-gray-500' }
}

export function getDelayCategoryLabel(category: string): string {
  const map: Record<string, string> = {
    loading: '装卸效率',
    weather: '天气影响',
    vehicle: '车辆故障',
    traffic: '交通拥堵',
    other: '其他原因',
  }
  return map[category] || category
}

export function getSeverityLabel(severity: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    low: { label: '低', color: 'bg-green-100 text-green-800' },
    medium: { label: '中', color: 'bg-yellow-100 text-yellow-800' },
    high: { label: '高', color: 'bg-orange-100 text-orange-800' },
    critical: { label: '严重', color: 'bg-red-100 text-red-800' },
  }
  return map[severity] || { label: severity, color: 'bg-gray-100 text-gray-800' }
}

export function isLowSample(count: number, threshold = 5): boolean {
  return count < threshold
}

export function sanitizeForPermission<T extends Record<string, any>>(
  data: T,
  canViewSensitive: boolean,
  sensitiveFields: string[]
): Partial<T> {
  if (canViewSensitive) return data
  const sanitized = { ...data }
  sensitiveFields.forEach(field => {
    delete sanitized[field]
  })
  return sanitized
}
