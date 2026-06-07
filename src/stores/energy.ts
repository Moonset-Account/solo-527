import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Device, EnergyReading, Alert, EnergyStats } from '../types'
import { mockDevices, generateEnergyReadings, mockAlerts, mockTimeOfUsePrices } from '../mock'
import { calculateEnergyStats } from '../utils'

export const useEnergyStore = defineStore('energy', () => {
  const devices = ref<Device[]>(mockDevices)
  const readings = ref<EnergyReading[]>(generateEnergyReadings(72))
  const alerts = ref<Alert[]>(mockAlerts)
  const selectedDimension = ref<'building' | 'floor' | 'tenant' | 'device'>('building')
  const selectedTimeRange = ref<'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom'>('day')

  const onlineDevices = computed(() => devices.value.filter(d => d.status === 'online'))
  const offlineDevices = computed(() => devices.value.filter(d => d.status === 'offline'))
  const warningDevices = computed(() => devices.value.filter(d => d.status === 'warning'))

  const openAlerts = computed(() => alerts.value.filter(a => a.status === 'open'))
  const acknowledgedAlerts = computed(() => alerts.value.filter(a => a.status === 'acknowledged'))
  const resolvedAlerts = computed(() => alerts.value.filter(a => a.status === 'resolved'))

  const stats = computed<EnergyStats>(() => {
    return calculateEnergyStats(readings.value, mockTimeOfUsePrices)
  })

  function getReadingsByDeviceType(type: 'electricity' | 'water' | 'hvac'): EnergyReading[] {
    const deviceIds = devices.value.filter(d => d.type === type).map(d => d.id)
    return readings.value.filter(r => deviceIds.includes(r.deviceId))
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
    readings.value = generateEnergyReadings(72)
  }

  return {
    devices,
    readings,
    alerts,
    selectedDimension,
    selectedTimeRange,
    onlineDevices,
    offlineDevices,
    warningDevices,
    openAlerts,
    acknowledgedAlerts,
    resolvedAlerts,
    stats,
    getReadingsByDeviceType,
    acknowledgeAlert,
    resolveAlert,
    refreshData
  }
})
