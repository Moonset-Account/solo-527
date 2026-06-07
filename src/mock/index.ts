import type { Building, Floor, Tenant, Device, EnergyReading, Alert, AllocationRule, TimeOfUsePrice } from '../types'

export const mockBuildings: Building[] = [
  {
    id: 'bld-001',
    name: '智慧大厦 A座',
    totalArea: 50000,
    createdAt: '2024-01-01T00:00:00Z'
  }
]

export const mockFloors: Floor[] = [
  { id: 'flr-001', buildingId: 'bld-001', floorNumber: 1, area: 5000, name: '1F 大堂' },
  { id: 'flr-002', buildingId: 'bld-001', floorNumber: 2, area: 5000, name: '2F 商业' },
  { id: 'flr-003', buildingId: 'bld-001', floorNumber: 3, area: 5000, name: '3F 办公' },
  { id: 'flr-004', buildingId: 'bld-001', floorNumber: 4, area: 5000, name: '4F 办公' },
  { id: 'flr-005', buildingId: 'bld-001', floorNumber: 5, area: 5000, name: '5F 办公' }
]

export const mockTenants: Tenant[] = [
  { id: 'ten-001', floorId: 'flr-002', name: '星巴克咖啡', area: 300, peopleCount: 15, contact: '张经理 138****1234' },
  { id: 'ten-002', floorId: 'flr-002', name: '优衣库', area: 800, peopleCount: 25, contact: '李店长 139****5678' },
  { id: 'ten-003', floorId: 'flr-003', name: '科技创新公司', area: 1500, peopleCount: 120, contact: '王总 137****9012' },
  { id: 'ten-004', floorId: 'flr-003', name: '法律咨询事务所', area: 500, peopleCount: 30, contact: '陈律师 136****3456' },
  { id: 'ten-005', floorId: 'flr-004', name: '互联网教育', area: 2000, peopleCount: 180, contact: '刘总监 135****7890' },
  { id: 'ten-006', floorId: 'flr-005', name: '金融投资集团', area: 2500, peopleCount: 200, contact: '赵总 134****2345' }
]

export const mockDevices: Device[] = [
  { id: 'dev-001', floorId: 'flr-001', type: 'electricity', name: '1F 总电表', status: 'online', lastOnline: '2025-06-07T10:00:00Z', location: '1F 配电室' },
  { id: 'dev-002', floorId: 'flr-001', type: 'water', name: '1F 总水表', status: 'online', lastOnline: '2025-06-07T10:00:00Z', location: '1F 水井房' },
  { id: 'dev-003', floorId: 'flr-001', type: 'hvac', name: '1F 中央空调', status: 'online', lastOnline: '2025-06-07T10:00:00Z', location: '1F 机房' },
  { id: 'dev-004', floorId: 'flr-002', type: 'electricity', name: '2F 总电表', status: 'online', lastOnline: '2025-06-07T10:00:00Z', location: '2F 配电室' },
  { id: 'dev-005', floorId: 'flr-002', type: 'water', name: '2F 总水表', status: 'warning', lastOnline: '2025-06-07T08:30:00Z', location: '2F 水井房' },
  { id: 'dev-006', floorId: 'flr-002', type: 'hvac', name: '2F 中央空调', status: 'online', lastOnline: '2025-06-07T10:00:00Z', location: '2F 机房' },
  { id: 'dev-007', floorId: 'flr-003', type: 'electricity', name: '3F 总电表', status: 'online', lastOnline: '2025-06-07T10:00:00Z', location: '3F 配电室' },
  { id: 'dev-008', floorId: 'flr-003', type: 'water', name: '3F 总水表', status: 'online', lastOnline: '2025-06-07T10:00:00Z', location: '3F 水井房' },
  { id: 'dev-009', floorId: 'flr-003', type: 'hvac', name: '3F 中央空调', status: 'offline', lastOnline: '2025-06-06T22:00:00Z', location: '3F 机房' },
  { id: 'dev-010', floorId: 'flr-004', type: 'electricity', name: '4F 总电表', status: 'online', lastOnline: '2025-06-07T10:00:00Z', location: '4F 配电室' },
  { id: 'dev-011', floorId: 'flr-004', type: 'water', name: '4F 总水表', status: 'online', lastOnline: '2025-06-07T10:00:00Z', location: '4F 水井房' },
  { id: 'dev-012', floorId: 'flr-004', type: 'hvac', name: '4F 中央空调', status: 'online', lastOnline: '2025-06-07T10:00:00Z', location: '4F 机房' },
  { id: 'dev-013', floorId: 'flr-005', type: 'electricity', name: '5F 总电表', status: 'online', lastOnline: '2025-06-07T10:00:00Z', location: '5F 配电室' },
  { id: 'dev-014', floorId: 'flr-005', type: 'water', name: '5F 总水表', status: 'online', lastOnline: '2025-06-07T10:00:00Z', location: '5F 水井房' },
  { id: 'dev-015', floorId: 'flr-005', type: 'hvac', name: '5F 中央空调', status: 'online', lastOnline: '2025-06-07T10:00:00Z', location: '5F 机房' }
]

export function generateEnergyReadings(hours: number = 24): EnergyReading[] {
  const readings: EnergyReading[] = []
  const now = new Date()

  mockDevices.forEach((device, deviceIdx) => {
    for (let i = hours; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000)
      const hour = timestamp.getHours()

      let baseValue = 0
      if (device.type === 'electricity') {
        baseValue = hour >= 8 && hour <= 18 ? 80 + Math.random() * 40 : 30 + Math.random() * 20
      } else if (device.type === 'water') {
        baseValue = hour >= 9 && hour <= 17 ? 5 + Math.random() * 3 : 1 + Math.random() * 1
      } else {
        baseValue = hour >= 8 && hour <= 20 ? 40 + Math.random() * 20 : 15 + Math.random() * 10
      }

      const isOffline = device.status === 'offline' && i < 12
      const isWarning = device.status === 'warning' && i === 2

      readings.push({
        id: `reading-${device.id}-${i}`,
        deviceId: device.id,
        timestamp: timestamp.toISOString(),
        value: isOffline ? 0 : baseValue + Math.sin(i / 3) * 5,
        quality: isOffline ? 'bad' : isWarning ? 'uncertain' : 'good',
        isOffline
      })
    }
  })

  return readings
}

export const mockAlerts: Alert[] = [
  {
    id: 'alt-001',
    deviceId: 'dev-009',
    deviceName: '3F 中央空调',
    type: 'device_offline',
    level: 'critical',
    message: '设备已离线超过 12 小时，无法采集数据',
    createdAt: '2025-06-06T22:00:00Z',
    status: 'open'
  },
  {
    id: 'alt-002',
    deviceId: 'dev-005',
    deviceName: '2F 总水表',
    type: 'missing_reading',
    level: 'warning',
    message: '数据采集不稳定，存在丢包现象',
    createdAt: '2025-06-07T08:30:00Z',
    status: 'acknowledged',
    handledAt: '2025-06-07T09:00:00Z',
    handledBy: '系统管理员',
    note: '已通知运维人员检查网络'
  },
  {
    id: 'alt-003',
    deviceId: 'dev-010',
    deviceName: '4F 总电表',
    type: 'energy_spike',
    level: 'warning',
    message: '今日用电峰值较昨日同期增长 35%，请核查',
    createdAt: '2025-06-07T14:30:00Z',
    status: 'open'
  },
  {
    id: 'alt-004',
    deviceId: 'dev-007',
    deviceName: '3F 总电表',
    type: 'energy_drop',
    level: 'info',
    message: '本周末用电量较上周末下降 15%，属于正常波动',
    createdAt: '2025-06-07T00:00:00Z',
    status: 'resolved',
    handledAt: '2025-06-07T08:00:00Z',
    handledBy: '系统管理员',
    note: '周末加班人员减少，属正常情况'
  }
]

export const mockAllocationRules: AllocationRule[] = [
  {
    id: 'rule-001',
    name: '按面积分摊公共能耗',
    method: 'by_area',
    params: { includeCommonArea: true },
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'rule-002',
    name: '按人数分摊公共能耗',
    method: 'by_people',
    params: {},
    isActive: false,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'rule-003',
    name: '按用量比例分摊',
    method: 'by_usage_ratio',
    params: {},
    isActive: false,
    createdAt: '2024-06-01T00:00:00Z'
  }
]

export const mockTimeOfUsePrices: TimeOfUsePrice[] = [
  { period: 'critical', startTime: '10:00', endTime: '12:00', price: 1.5, name: '尖峰时段' },
  { period: 'critical', startTime: '19:00', endTime: '21:00', price: 1.5, name: '尖峰时段' },
  { period: 'peak', startTime: '08:00', endTime: '10:00', price: 1.2, name: '峰时段' },
  { period: 'peak', startTime: '12:00', endTime: '14:00', price: 1.2, name: '峰时段' },
  { period: 'peak', startTime: '17:00', endTime: '19:00', price: 1.2, name: '峰时段' },
  { period: 'peak', startTime: '21:00', endTime: '23:00', price: 1.2, name: '峰时段' },
  { period: 'flat', startTime: '06:00', endTime: '08:00', price: 0.8, name: '平时段' },
  { period: 'flat', startTime: '14:00', endTime: '17:00', price: 0.8, name: '平时段' },
  { period: 'flat', startTime: '23:00', endTime: '24:00', price: 0.8, name: '平时段' },
  { period: 'valley', startTime: '00:00', endTime: '06:00', price: 0.4, name: '谷时段' }
]
