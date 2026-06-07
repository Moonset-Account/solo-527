import dayjs from 'dayjs'
import type { Tenant, AllocationResult, EnergyReading, EnergyStats, TimeOfUsePrice, ChartDataPoint } from '../types'

export function formatNumber(num: number, decimals: number = 2): string {
  return num.toLocaleString('zh-CN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export function formatDateTime(date: string | Date): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

export function formatDate(date: string | Date): string {
  return dayjs(date).format('YYYY-MM-DD')
}

export function formatTime(date: string | Date): string {
  return dayjs(date).format('HH:mm')
}

export function getTimeRangeText(range: string): string {
  const now = dayjs()
  switch (range) {
    case 'day':
      return `${now.format('YYYY-MM-DD')} 当日`
    case 'week':
      return `${now.startOf('week').format('YYYY-MM-DD')} ~ ${now.endOf('week').format('YYYY-MM-DD')}`
    case 'month':
      return now.format('YYYY年MM月')
    case 'quarter':
      return `${now.format('YYYY年')} 第${Math.floor(now.month() / 3) + 1}季度`
    case 'year':
      return now.format('YYYY年')
    default:
      return '自定义'
  }
}

export function allocateByArea(commonEnergy: number, tenants: Tenant[]): Omit<AllocationResult, 'id' | 'ruleId' | 'period'>[] {
  const totalArea = tenants.reduce((sum, t) => sum + t.area, 0)
  return tenants.map(t => ({
    tenantId: t.id,
    tenantName: t.name,
    commonEnergy,
    allocatedEnergy: (t.area / totalArea) * commonEnergy,
    tenantUsage: Math.random() * 1000 + 500,
    totalEnergy: 0,
    formula: `公共能耗 × (租户面积 ${t.area}㎡ / 总面积 ${totalArea}㎡)`
  })).map(r => ({ ...r, totalEnergy: r.tenantUsage + r.allocatedEnergy }))
}

export function allocateByPeople(commonEnergy: number, tenants: Tenant[]): Omit<AllocationResult, 'id' | 'ruleId' | 'period'>[] {
  const totalPeople = tenants.reduce((sum, t) => sum + t.peopleCount, 0)
  return tenants.map(t => ({
    tenantId: t.id,
    tenantName: t.name,
    commonEnergy,
    allocatedEnergy: (t.peopleCount / totalPeople) * commonEnergy,
    tenantUsage: Math.random() * 1000 + 500,
    totalEnergy: 0,
    formula: `公共能耗 × (租户人数 ${t.peopleCount}人 / 总人数 ${totalPeople}人)`
  })).map(r => ({ ...r, totalEnergy: r.tenantUsage + r.allocatedEnergy }))
}

export function allocateEven(commonEnergy: number, tenants: Tenant[]): Omit<AllocationResult, 'id' | 'ruleId' | 'period'>[] {
  const perTenant = commonEnergy / tenants.length
  return tenants.map(t => ({
    tenantId: t.id,
    tenantName: t.name,
    commonEnergy,
    allocatedEnergy: perTenant,
    tenantUsage: Math.random() * 1000 + 500,
    totalEnergy: 0,
    formula: `公共能耗 / 租户数量 (${tenants.length}户)`
  })).map(r => ({ ...r, totalEnergy: r.tenantUsage + r.allocatedEnergy }))
}

export function calculateEnergyStats(readings: EnergyReading[], touPrices: TimeOfUsePrice[]): EnergyStats {
  const validReadings = readings.filter(r => !r.isOffline)
  let peak = 0, valley = 0, flat = 0, critical = 0

  validReadings.forEach(reading => {
    const hour = dayjs(reading.timestamp).hour()
    const timeStr = `${hour.toString().padStart(2, '0')}:00`
    
    const matchingPrice = touPrices.find(p => {
      const start = parseInt(p.startTime.split(':')[0])
      const end = parseInt(p.endTime.split(':')[0])
      return hour >= start && hour < end
    })

    if (matchingPrice) {
      switch (matchingPrice.period) {
        case 'peak': peak += reading.value; break
        case 'valley': valley += reading.value; break
        case 'flat': flat += reading.value; break
        case 'critical': critical += reading.value; break
      }
    } else {
      flat += reading.value
    }
  })

  return {
    total: peak + valley + flat + critical,
    peak,
    valley,
    flat,
    critical,
    unit: 'kWh',
    sampleCount: validReadings.length,
    totalSamples: readings.length
  }
}

export function aggregateByHour(readings: EnergyReading[]): ChartDataPoint[] {
  const hourlyData = new Map<string, { value: number; count: number; isOffline: boolean }>()

  readings.forEach(reading => {
    const hourKey = dayjs(reading.timestamp).format('YYYY-MM-DD HH:00')
    const existing = hourlyData.get(hourKey) || { value: 0, count: 0, isOffline: false }
    
    if (!reading.isOffline) {
      existing.value += reading.value
      existing.count += 1
    }
    existing.isOffline = existing.isOffline || reading.isOffline
    
    hourlyData.set(hourKey, existing)
  })

  return Array.from(hourlyData.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([timestamp, data]) => ({
      timestamp,
      value: data.count > 0 ? data.value / data.count : 0,
      label: dayjs(timestamp).format('HH:mm'),
      isOffline: data.isOffline && data.count === 0
    }))
}

export function getDeviceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    electricity: '电表',
    water: '水表',
    hvac: '空调'
  }
  return labels[type] || type
}

export function getDeviceTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    electricity: 'Zap',
    water: 'Droplets',
    hvac: 'Wind'
  }
  return icons[type] || 'Circle'
}

export function getAlertLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    critical: '严重',
    warning: '警告',
    info: '提示'
  }
  return labels[level] || level
}

export function getAlertTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    device_offline: '设备离线',
    energy_spike: '能耗突增',
    energy_drop: '能耗突降',
    missing_reading: '数据缺失'
  }
  return labels[type] || type
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    online: '在线',
    offline: '离线',
    warning: '异常',
    open: '待处理',
    acknowledged: '已确认',
    resolved: '已解决'
  }
  return labels[status] || status
}

export function exportToCSV(data: any[], filename: string): void {
  const headers = Object.keys(data[0] || {})
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(h => `"${row[h] ?? ''}"`).join(','))
  ].join('\n')

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}_${dayjs().format('YYYYMMDD_HHmmss')}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}
