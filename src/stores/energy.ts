import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import dayjs from 'dayjs'
import type { Device, EnergyReading, Alert, EnergyStats, Dimension, TimeRange } from '../types'
import { mockDevices, generateEnergyReadings, mockAlerts, mockTimeOfUsePrices, mockFloors, mockTenants } from '../mock'
import { calculateEnergyStats } from '../utils'

function generateReadingsByTimeRange(timeRange: TimeRange): EnergyReading[] {
  let hours = 24
  switch (timeRange) {
    case 'day': hours = 24; break
    case 'week': hours = 24 * 7; break
    case 'month': hours = 24 * 30; break
    case 'quarter': hours = 24 * 90; break
    case 'year': hours = 24 * 365; break
    default: hours = 24
  }
  return generateEnergyReadings(hours)
}

export const useEnergyStore = defineStore('energy', () => {
  const devices = ref<Device[]>(mockDevices)
  const baseReadings = ref<EnergyReading[]>(generateEnergyReadings(24 * 30))
  const alerts = ref<Alert[]>(mockAlerts)
  const selectedDimension = ref<Dimension>('building')
  const selectedTimeRange = ref<TimeRange>('day')
  const selectedDimensionId = ref<string>('')
  const importedReadings = ref<EnergyReading[]>([])

  const onlineDevices = computed(() => devices.value.filter(d => d.status === 'online'))
  const offlineDevices = computed(() => devices.value.filter(d => d.status === 'offline'))
  const warningDevices = computed(() => devices.value.filter(d => d.status === 'warning'))

  const openAlerts = computed(() => alerts.value.filter(a => a.status === 'open'))
  const acknowledgedAlerts = computed(() => alerts.value.filter(a => a.status === 'acknowledged'))
  const resolvedAlerts = computed(() => alerts.value.filter(a => a.status === 'resolved'))

  const filteredDevices = computed(() => {
    if (selectedDimension.value === 'building') {
      return devices.value
    }
    if (selectedDimension.value === 'floor') {
      const floorId = selectedDimensionId.value || 'flr-001'
      return devices.value.filter(d => d.floorId === floorId)
    }
    if (selectedDimension.value === 'tenant') {
      const tenantId = selectedDimensionId.value || 'ten-001'
      const tenant = mockTenants.find(t => t.id === tenantId)
      if (tenant) {
        return devices.value.filter(d => d.floorId === tenant.floorId)
      }
      return devices.value
    }
    if (selectedDimension.value === 'device') {
      const deviceId = selectedDimensionId.value
      if (deviceId) {
        return devices.value.filter(d => d.id === deviceId)
      }
      return devices.value.slice(0, 1)
    }
    return devices.value
  })

  const filteredReadings = computed(() => {
    const allReadings = importedReadings.value.length > 0 ? importedReadings.value : baseReadings.value
    const deviceIds = filteredDevices.value.map(d => d.id)
    
    const now = dayjs()
    let startTime: dayjs.Dayjs
    
    switch (selectedTimeRange.value) {
      case 'day':
        startTime = now.startOf('day')
        break
      case 'week':
        startTime = now.startOf('week')
        break
      case 'month':
        startTime = now.startOf('month')
        break
      case 'quarter':
        startTime = now.startOf('month').subtract((now.month() % 3), 'month')
        break
      case 'year':
        startTime = now.startOf('year')
        break
      default:
        startTime = now.subtract(24, 'hour')
    }

    return allReadings.filter(r => {
      const inDevice = deviceIds.includes(r.deviceId)
      const inTime = dayjs(r.timestamp).isAfter(startTime)
      return inDevice && inTime
    })
  })

  const stats = computed<EnergyStats>(() => {
    return calculateEnergyStats(filteredReadings.value, mockTimeOfUsePrices)
  })

  function getReadingsByDeviceType(type: 'electricity' | 'water' | 'hvac'): EnergyReading[] {
    const deviceIds = filteredDevices.value.filter(d => d.type === type).map(d => d.id)
    return filteredReadings.value.filter(r => deviceIds.includes(r.deviceId))
  }

  function importReadings(newReadings: EnergyReading[]): void {
    importedReadings.value = [...importedReadings.value, ...newReadings]
  }

  function importDevices(newDevices: Device[]): void {
    const existingIds = new Set(devices.value.map(d => d.id))
    const uniqueNew = newDevices.filter(d => !existingIds.has(d.id))
    devices.value = [...devices.value, ...uniqueNew]
  }

  function acknowledgeAlert(alertId: string, note: string): void {
    const alert = alerts.value.find(a => a.id === alertId)
    if (alert) {
      alert.status = 'acknowledged'
      alert.handledAt = new Date().toISOString()
      alert.handledBy = '当前管理员'
      alert.note = note
    }
  }

  function resolveAlert(alertId: string, note: string): void {
    const alert = alerts.value.find(a => a.id === alertId)
    if (alert) {
      alert.status = 'resolved'
      alert.handledAt = new Date().toISOString()
      alert.handledBy = '当前管理员'
      alert.note = note
    }
  }

  function refreshData(): void {
    baseReadings.value = generateReadingsByTimeRange(selectedTimeRange.value)
  }

  watch(selectedTimeRange, () => {
    baseReadings.value = generateReadingsByTimeRange(selectedTimeRange.value)
  })

  return {
    devices,
    readings: filteredReadings,
    baseReadings,
    importedReadings,
    alerts,
    selectedDimension,
    selectedTimeRange,
    selectedDimensionId,
    filteredDevices,
    filteredReadings,
    onlineDevices,
    offlineDevices,
    warningDevices,
    openAlerts,
    acknowledgedAlerts,
    resolvedAlerts,
    stats,
    getReadingsByDeviceType,
    importReadings,
    importDevices,
    acknowledgeAlert,
    resolveAlert,
    refreshData
  }
})
