import axios from 'axios'
import type {
  EnergyOverview,
  EnergyCurvePoint,
  ZoneEnergyComparison,
  Meter,
  Zone,
  Alarm,
  AlarmReview,
  Subsidy,
  SyncTask,
  DataQueryParams,
  DataQueryResult,
  PageResult,
  UserInfo,
} from '@/types'

const USE_MOCK = true

const http = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error),
)

const mockZones: Zone[] = [
  { id: 1, name: 'A栋办公区', meterCount: 4, totalUsage: 12580.5, createdAt: '2024-01-15T08:00:00Z', sourceDocumentNo: 'DOC-ZONE-001', remark: '含办公室、会议室及公共区域' },
  { id: 2, name: 'B栋生产区', meterCount: 4, totalUsage: 38720.0, createdAt: '2024-01-15T08:00:00Z', sourceDocumentNo: 'DOC-ZONE-002', remark: '含三条产线及配套设备' },
  { id: 3, name: 'C栋仓储区', meterCount: 2, totalUsage: 6830.0, createdAt: '2024-02-01T08:00:00Z', sourceDocumentNo: 'DOC-ZONE-003', remark: '恒温仓储及冷库区域' },
  { id: 4, name: '综合服务区', meterCount: 2, totalUsage: 5420.0, createdAt: '2024-02-01T08:00:00Z', sourceDocumentNo: 'DOC-ZONE-004', remark: '食堂、宿舍及配套服务设施' },
]

const mockMeters: Meter[] = [
  { id: 1, meterNo: 'ELEC-2024-001', location: 'A栋1楼配电间', zoneId: 1, zoneName: 'A栋办公区', status: 'online', lastSyncTime: '2026-06-11T10:30:00Z', lastSyncStatus: 'success', sourceDocumentNo: 'DOC-MTR-001', remark: '主进线电表', createdAt: '2024-01-20T08:00:00Z' },
  { id: 2, meterNo: 'ELEC-2024-002', location: 'A栋2楼配电间', zoneId: 1, zoneName: 'A栋办公区', status: 'online', lastSyncTime: '2026-06-11T10:28:00Z', lastSyncStatus: 'success', sourceDocumentNo: 'DOC-MTR-002', remark: '楼层分配电表', createdAt: '2024-01-20T08:00:00Z' },
  { id: 3, meterNo: 'ELEC-2024-003', location: 'A栋3楼配电间', zoneId: 1, zoneName: 'A栋办公区', status: 'offline', lastSyncTime: '2026-06-11T08:15:00Z', lastSyncStatus: 'failed', sourceDocumentNo: 'DOC-MTR-003', remark: '通信中断', createdAt: '2024-01-20T08:00:00Z' },
  { id: 4, meterNo: 'ELEC-2024-004', location: 'A栋屋顶光伏', zoneId: 1, zoneName: 'A栋办公区', status: 'online', lastSyncTime: '2026-06-11T10:32:00Z', lastSyncStatus: 'success', sourceDocumentNo: 'DOC-MTR-004', remark: '光伏并网计量', createdAt: '2024-03-10T08:00:00Z' },
  { id: 5, meterNo: 'ELEC-2024-005', location: 'B栋1楼产线A配电', zoneId: 2, zoneName: 'B栋生产区', status: 'online', lastSyncTime: '2026-06-11T10:31:00Z', lastSyncStatus: 'success', sourceDocumentNo: 'DOC-MTR-005', remark: '产线A主表', createdAt: '2024-01-25T08:00:00Z' },
  { id: 6, meterNo: 'ELEC-2024-006', location: 'B栋1楼产线B配电', zoneId: 2, zoneName: 'B栋生产区', status: 'fault', lastSyncTime: '2026-06-10T22:00:00Z', lastSyncStatus: 'failed', sourceDocumentNo: 'DOC-MTR-006', remark: '设备故障待维修', createdAt: '2024-01-25T08:00:00Z' },
  { id: 7, meterNo: 'ELEC-2024-007', location: 'B栋2楼产线C配电', zoneId: 2, zoneName: 'B栋生产区', status: 'online', lastSyncTime: '2026-06-11T10:29:00Z', lastSyncStatus: 'success', sourceDocumentNo: 'DOC-MTR-007', remark: '产线C主表', createdAt: '2024-01-25T08:00:00Z' },
  { id: 8, meterNo: 'ELEC-2024-008', location: 'B栋2楼空调配电', zoneId: 2, zoneName: 'B栋生产区', status: 'online', lastSyncTime: '2026-06-11T10:25:00Z', lastSyncStatus: 'success', sourceDocumentNo: 'DOC-MTR-008', remark: '中央空调独立计量', createdAt: '2024-04-05T08:00:00Z' },
  { id: 9, meterNo: 'ELEC-2024-009', location: 'C栋1楼常温仓配电', zoneId: 3, zoneName: 'C栋仓储区', status: 'online', lastSyncTime: '2026-06-11T10:20:00Z', lastSyncStatus: 'success', sourceDocumentNo: 'DOC-MTR-009', remark: '常温仓储照明及动力', createdAt: '2024-02-05T08:00:00Z' },
  { id: 10, meterNo: 'ELEC-2024-010', location: 'C栋1楼冷库配电', zoneId: 3, zoneName: 'C栋仓储区', status: 'online', lastSyncTime: '2026-06-11T10:18:00Z', lastSyncStatus: 'success', sourceDocumentNo: 'DOC-MTR-010', remark: '冷库制冷机组', createdAt: '2024-02-05T08:00:00Z' },
  { id: 11, meterNo: 'ELEC-2024-011', location: '综合楼1楼食堂配电', zoneId: 4, zoneName: '综合服务区', status: 'online', lastSyncTime: '2026-06-11T10:22:00Z', lastSyncStatus: 'success', sourceDocumentNo: 'DOC-MTR-011', remark: '食堂厨房及照明', createdAt: '2024-02-10T08:00:00Z' },
  { id: 12, meterNo: 'ELEC-2024-012', location: '综合楼2楼宿舍配电', zoneId: 4, zoneName: '综合服务区', status: 'online', lastSyncTime: '2026-06-11T10:15:00Z', lastSyncStatus: 'success', sourceDocumentNo: 'DOC-MTR-012', remark: '宿舍区域总表', createdAt: '2024-02-10T08:00:00Z' },
  { id: 13, meterNo: 'ELEC-2024-013', location: 'B栋3楼备用配电', zoneId: 2, zoneName: 'B栋生产区', status: 'offline', lastSyncTime: '2026-06-09T14:00:00Z', lastSyncStatus: 'pending', sourceDocumentNo: 'DOC-MTR-013', remark: '备用产线配电待启用', createdAt: '2024-05-15T08:00:00Z' },
]

const mockAlarms: Alarm[] = [
  { id: 1, type: 'peak_anomaly', level: 'critical', meterId: 5, meterNo: 'ELEC-2024-005', zoneName: 'B栋生产区', message: '产线A瞬时功率超出需量阈值150%，疑似设备异常启动', status: 'pending', assignee: '张工', occurredAt: '2026-06-11T09:15:00Z', confirmedAt: null, resolvedAt: null, responseDuration: null, rootCause: '', sourceDocumentNo: 'DOC-ALM-001', remark: '' },
  { id: 2, type: 'device_fault', level: 'critical', meterId: 6, meterNo: 'ELEC-2024-006', zoneName: 'B栋生产区', message: '电表通信中断，疑似采集终端硬件故障', status: 'confirmed', assignee: '李工', occurredAt: '2026-06-10T22:05:00Z', confirmedAt: '2026-06-10T22:30:00Z', resolvedAt: null, responseDuration: null, rootCause: '采集终端RS485接口损坏', sourceDocumentNo: 'DOC-ALM-002', remark: '已联系厂家更换' },
  { id: 3, type: 'data_anomaly', level: 'warning', meterId: 3, meterNo: 'ELEC-2024-003', zoneName: 'A栋办公区', message: 'A栋3楼电表数据跳变，当前读数比上次减少1280kWh', status: 'processing', assignee: '王工', occurredAt: '2026-06-11T07:30:00Z', confirmedAt: '2026-06-11T08:00:00Z', resolvedAt: null, responseDuration: null, rootCause: '', sourceDocumentNo: 'DOC-ALM-003', remark: '排查中' },
  { id: 4, type: 'communication_loss', level: 'warning', meterId: 3, meterNo: 'ELEC-2024-003', zoneName: 'A栋办公区', message: '电表连续3个采集周期无响应', status: 'resolved', assignee: '赵工', occurredAt: '2026-06-09T14:20:00Z', confirmedAt: '2026-06-09T14:45:00Z', resolvedAt: '2026-06-09T16:30:00Z', responseDuration: 130, rootCause: '网关配置变更导致路由丢失', sourceDocumentNo: 'DOC-ALM-004', remark: '已恢复网关配置' },
  { id: 5, type: 'peak_anomaly', level: 'info', meterId: 10, meterNo: 'ELEC-2024-010', zoneName: 'C栋仓储区', message: '冷库用电高峰时段接近需量上限(95%)', status: 'resolved', assignee: '孙工', occurredAt: '2026-06-08T13:00:00Z', confirmedAt: '2026-06-08T13:20:00Z', resolvedAt: '2026-06-08T14:00:00Z', responseDuration: 60, rootCause: '高温天气制冷负荷增大', sourceDocumentNo: 'DOC-ALM-005', remark: '已调整制冷策略' },
  { id: 6, type: 'data_anomaly', level: 'warning', meterId: 8, meterNo: 'ELEC-2024-008', zoneName: 'B栋生产区', message: '空调电表功率因数异常偏低(0.45)，低于正常范围', status: 'pending', assignee: '张工', occurredAt: '2026-06-11T08:45:00Z', confirmedAt: null, resolvedAt: null, responseDuration: null, rootCause: '', sourceDocumentNo: 'DOC-ALM-006', remark: '' },
  { id: 7, type: 'communication_loss', level: 'info', meterId: 13, meterNo: 'ELEC-2024-013', zoneName: 'B栋生产区', message: '备用配电表通信超时，设备处于离线状态', status: 'pending', assignee: '李工', occurredAt: '2026-06-09T14:05:00Z', confirmedAt: null, resolvedAt: null, responseDuration: null, rootCause: '', sourceDocumentNo: 'DOC-ALM-007', remark: '设备待启用，低优先级' },
  { id: 8, type: 'device_fault', level: 'critical', meterId: 6, meterNo: 'ELEC-2024-006', zoneName: 'B栋生产区', message: '电表上报内部存储器故障，历史数据可能丢失', status: 'confirmed', assignee: '李工', occurredAt: '2026-06-11T06:00:00Z', confirmedAt: '2026-06-11T06:30:00Z', resolvedAt: null, responseDuration: null, rootCause: '', sourceDocumentNo: 'DOC-ALM-008', remark: '等待厂家到场处理' },
]

const mockSubsidies: Subsidy[] = [
  { id: 1, type: '节能减排专项补贴', amount: 150000, sourceDocumentNo: 'SUB-2026-001', sourceDocumentUrl: '/documents/sub-2026-001.pdf', remark: '2026年度节能减排专项补贴第一批', createdBy: '管理员', createdAt: '2026-03-01T08:00:00Z', approvedBy: '财务总监', approvedAt: '2026-03-05T10:00:00Z', status: 'approved' },
  { id: 2, type: '绿色制造示范奖励', amount: 80000, sourceDocumentNo: 'SUB-2026-002', sourceDocumentUrl: '/documents/sub-2026-002.pdf', remark: '省级绿色制造示范企业奖励', createdBy: '管理员', createdAt: '2026-04-10T08:00:00Z', approvedBy: null, approvedAt: null, status: 'pending' },
  { id: 3, type: '光伏发电补贴', amount: 45000, sourceDocumentNo: 'SUB-2026-003', sourceDocumentUrl: '/documents/sub-2026-003.pdf', remark: 'A栋屋顶光伏并网发电补贴(一季度)', createdBy: '管理员', createdAt: '2026-04-15T08:00:00Z', approvedBy: '财务总监', approvedAt: '2026-04-20T09:00:00Z', status: 'approved' },
  { id: 4, type: '电力需求侧管理补贴', amount: 32000, sourceDocumentNo: 'SUB-2026-004', sourceDocumentUrl: '/documents/sub-2026-004.pdf', remark: '参与电力需求侧响应补贴', createdBy: '管理员', createdAt: '2026-05-05T08:00:00Z', approvedBy: null, approvedAt: null, status: 'rejected' },
  { id: 5, type: '节能减排专项补贴', amount: 120000, sourceDocumentNo: 'SUB-2026-005', sourceDocumentUrl: '/documents/sub-2026-005.pdf', remark: '2026年度节能减排专项补贴第二批', createdBy: '管理员', createdAt: '2026-06-01T08:00:00Z', approvedBy: null, approvedAt: null, status: 'pending' },
]

const mockSyncTasks: SyncTask[] = [
  { id: 1, type: 'meter_reading', meterId: 1, meterNo: 'ELEC-2024-001', status: 'success', triggeredAt: '2026-06-11T10:30:00Z', completedAt: '2026-06-11T10:30:12Z', duration: 12, failReason: null, friendlyFailReason: null, failCategory: null, retryCount: 0, retryResults: [] },
  { id: 2, type: 'meter_reading', meterId: 2, meterNo: 'ELEC-2024-002', status: 'success', triggeredAt: '2026-06-11T10:28:00Z', completedAt: '2026-06-11T10:28:08Z', duration: 8, failReason: null, friendlyFailReason: null, failCategory: null, retryCount: 0, retryResults: [] },
  { id: 3, type: 'meter_reading', meterId: 3, meterNo: 'ELEC-2024-003', status: 'failed', triggeredAt: '2026-06-11T10:25:00Z', completedAt: '2026-06-11T10:26:05Z', duration: 65, failReason: 'ConnectionTimeout: RS485 bus no response after 60s', friendlyFailReason: '电表通信超时，请检查采集终端与电表之间的RS485连接线是否松动或断开', failCategory: 'network', retryCount: 2, retryResults: [{ retryAt: '2026-06-11T10:35:00Z', success: false, message: '重试1：仍无法建立通信连接' }, { retryAt: '2026-06-11T10:45:00Z', success: false, message: '重试2：通信超时，建议现场排查' }] },
  { id: 4, type: 'meter_config', meterId: 6, meterNo: 'ELEC-2024-006', status: 'failed', triggeredAt: '2026-06-11T06:00:00Z', completedAt: '2026-06-11T06:01:30Z', duration: 90, failReason: 'DeviceError: Internal storage CRC check failed', friendlyFailReason: '电表内部存储器校验失败，可能存在硬件故障，建议联系厂家进行检修或更换', failCategory: 'data', retryCount: 1, retryResults: [{ retryAt: '2026-06-11T08:00:00Z', success: false, message: '重试1：存储器自检仍未通过' }] },
  { id: 5, type: 'alarm_sync', meterId: 5, meterNo: 'ELEC-2024-005', status: 'success', triggeredAt: '2026-06-11T09:16:00Z', completedAt: '2026-06-11T09:16:05Z', duration: 5, failReason: null, friendlyFailReason: null, failCategory: null, retryCount: 0, retryResults: [] },
  { id: 6, type: 'meter_reading', meterId: 5, meterNo: 'ELEC-2024-005', status: 'success', triggeredAt: '2026-06-11T10:31:00Z', completedAt: '2026-06-11T10:31:10Z', duration: 10, failReason: null, friendlyFailReason: null, failCategory: null, retryCount: 0, retryResults: [] },
  { id: 7, type: 'meter_reading', meterId: 6, meterNo: 'ELEC-2024-006', status: 'failed', triggeredAt: '2026-06-10T22:00:00Z', completedAt: '2026-06-10T22:01:05Z', duration: 65, failReason: 'ConnectionRefused: Device not responding on MODBUS address 3', friendlyFailReason: '电表无响应，采集终端无法连接到电表MODBUS地址，请确认电表是否上电且地址配置正确', failCategory: 'network', retryCount: 3, retryResults: [{ retryAt: '2026-06-10T22:15:00Z', success: false, message: '重试1：设备无响应' }, { retryAt: '2026-06-10T23:00:00Z', success: false, message: '重试2：设备无响应' }, { retryAt: '2026-06-11T06:00:00Z', success: false, message: '重试3：设备无响应，疑似硬件故障' }] },
  { id: 8, type: 'meter_config', meterId: 13, meterNo: 'ELEC-2024-013', status: 'failed', triggeredAt: '2026-06-09T14:00:00Z', completedAt: '2026-06-09T14:00:45Z', duration: 45, failReason: 'ConfigError: Meter not registered in gateway routing table', friendlyFailReason: '电表未在网关路由表中注册，请先在采集网关管理界面完成电表注册和参数配置', failCategory: 'config', retryCount: 0, retryResults: [] },
  { id: 9, type: 'meter_reading', meterId: 7, meterNo: 'ELEC-2024-007', status: 'success', triggeredAt: '2026-06-11T10:29:00Z', completedAt: '2026-06-11T10:29:07Z', duration: 7, failReason: null, friendlyFailReason: null, failCategory: null, retryCount: 0, retryResults: [] },
  { id: 10, type: 'meter_reading', meterId: 10, meterNo: 'ELEC-2024-010', status: 'success', triggeredAt: '2026-06-11T10:18:00Z', completedAt: '2026-06-11T10:18:15Z', duration: 15, failReason: null, friendlyFailReason: null, failCategory: null, retryCount: 0, retryResults: [] },
  { id: 11, type: 'alarm_sync', meterId: 8, meterNo: 'ELEC-2024-008', status: 'success', triggeredAt: '2026-06-11T08:46:00Z', completedAt: '2026-06-11T08:46:03Z', duration: 3, failReason: null, friendlyFailReason: null, failCategory: null, retryCount: 0, retryResults: [] },
  { id: 12, type: 'meter_reading', meterId: 8, meterNo: 'ELEC-2024-008', status: 'success', triggeredAt: '2026-06-11T10:25:00Z', completedAt: '2026-06-11T10:25:09Z', duration: 9, failReason: null, friendlyFailReason: null, failCategory: null, retryCount: 0, retryResults: [] },
]

function generateCurveData(period: string, zoneId?: number): EnergyCurvePoint[] {
  const points: EnergyCurvePoint[] = []
  const zoneMultiplier = zoneId === 2 ? 2.5 : zoneId === 3 ? 0.8 : zoneId === 4 ? 0.6 : 1
  const now = new Date('2026-06-11T10:30:00Z')

  if (period === 'today' || period === 'yesterday') {
    const offset = period === 'yesterday' ? 1 : 0
    const baseDate = new Date(now)
    baseDate.setDate(baseDate.getDate() - offset)
    for (let h = 0; h <= (period === 'today' ? now.getHours() : 23); h++) {
      const isPeak = h >= 8 && h <= 11 || h >= 17 && h <= 21
      const baseLoad = isPeak ? 180 + Math.random() * 80 : 40 + Math.random() * 60
      const ts = new Date(baseDate)
      ts.setHours(h, 0, 0, 0)
      points.push({
        time: `${String(h).padStart(2, '0')}:00`,
        value: Math.round(baseLoad * zoneMultiplier * 10) / 10,
        isPeak,
      })
    }
  } else if (period === 'week') {
    for (let d = 6; d >= 0; d--) {
      const date = new Date(now)
      date.setDate(date.getDate() - d)
      const isWeekend = date.getDay() === 0 || date.getDay() === 6
      const dailyTotal = isWeekend ? 800 + Math.random() * 300 : 2500 + Math.random() * 800
      points.push({
        time: `${date.getMonth() + 1}/${date.getDate()}`,
        value: Math.round(dailyTotal * zoneMultiplier * 10) / 10,
        isPeak: !isWeekend,
      })
    }
  } else if (period === 'month') {
    for (let d = 1; d <= 30; d++) {
      const date = new Date(2026, 5, d)
      const isWeekend = date.getDay() === 0 || date.getDay() === 6
      const dailyTotal = isWeekend ? 800 + Math.random() * 300 : 2500 + Math.random() * 800
      points.push({
        time: `${d}日`,
        value: Math.round(dailyTotal * zoneMultiplier * 10) / 10,
        isPeak: !isWeekend,
      })
    }
  }

  return points
}

function paginate<T>(items: T[], page: number, pageSize: number): PageResult<T> {
  const start = (page - 1) * pageSize
  return {
    total: items.length,
    items: items.slice(start, start + pageSize),
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const energyApi = {
  getOverview: async (): Promise<EnergyOverview> => {
    if (USE_MOCK) {
      await delay(300)
      return {
        todayUsage: 2856.3,
        monthUsage: 63550.5,
        yesterdayUsage: 3120.8,
        lastMonthUsage: 58920.0,
        peakUsage: 1860.5,
        peakRatio: 0.651,
      }
    }
    return http.get('/energy/overview')
  },

  getCurve: async (period: string, zoneId?: number): Promise<EnergyCurvePoint[]> => {
    if (USE_MOCK) {
      await delay(400)
      return generateCurveData(period, zoneId)
    }
    return http.get('/energy/curve', { params: { period, zoneId } })
  },

  getZoneComparison: async (): Promise<ZoneEnergyComparison[]> => {
    if (USE_MOCK) {
      await delay(300)
      const total = 63550.5
      return [
        { zoneId: 1, zoneName: 'A栋办公区', usage: 12580.5, percentage: Math.round((12580.5 / total) * 1000) / 10 },
        { zoneId: 2, zoneName: 'B栋生产区', usage: 38720.0, percentage: Math.round((38720.0 / total) * 1000) / 10 },
        { zoneId: 3, zoneName: 'C栋仓储区', usage: 6830.0, percentage: Math.round((6830.0 / total) * 1000) / 10 },
        { zoneId: 4, zoneName: '综合服务区', usage: 5420.0, percentage: Math.round((5420.0 / total) * 1000) / 10 },
      ]
    }
    return http.get('/energy/zone-comparison')
  },
}

export const meterApi = {
  getList: async (params: { page?: number; pageSize?: number; status?: string; zoneId?: number; keyword?: string }): Promise<PageResult<Meter>> => {
    if (USE_MOCK) {
      await delay(400)
      let filtered = [...mockMeters]
      if (params.status) filtered = filtered.filter((m) => m.status === params.status)
      if (params.zoneId) filtered = filtered.filter((m) => m.zoneId === params.zoneId)
      if (params.keyword) {
        const kw = params.keyword.toLowerCase()
        filtered = filtered.filter((m) => m.meterNo.toLowerCase().includes(kw) || m.location.toLowerCase().includes(kw))
      }
      const page = params.page || 1
      const pageSize = params.pageSize || 10
      return paginate(filtered, page, pageSize)
    }
    return http.get('/meters', { params })
  },

  getById: async (id: number): Promise<Meter> => {
    if (USE_MOCK) {
      await delay(200)
      const meter = mockMeters.find((m) => m.id === id)
      if (!meter) throw new Error('Meter not found')
      return meter
    }
    return http.get(`/meters/${id}`)
  },

  create: async (data: Partial<Meter>): Promise<Meter> => {
    if (USE_MOCK) {
      await delay(300)
      return { id: Date.now(), meterNo: '', location: '', zoneId: 0, zoneName: '', status: 'online', lastSyncTime: new Date().toISOString(), lastSyncStatus: 'pending', sourceDocumentNo: '', remark: '', createdAt: new Date().toISOString(), ...data } as Meter
    }
    return http.post('/meters', data)
  },

  update: async (id: number, data: Partial<Meter>): Promise<Meter> => {
    if (USE_MOCK) {
      await delay(300)
      const meter = mockMeters.find((m) => m.id === id)
      if (!meter) throw new Error('Meter not found')
      return { ...meter, ...data }
    }
    return http.put(`/meters/${id}`, data)
  },
}

export const zoneApi = {
  getList: async (): Promise<Zone[]> => {
    if (USE_MOCK) {
      await delay(300)
      return mockZones
    }
    return http.get('/zones')
  },

  getById: async (id: number): Promise<Zone> => {
    if (USE_MOCK) {
      await delay(200)
      const zone = mockZones.find((z) => z.id === id)
      if (!zone) throw new Error('Zone not found')
      return zone
    }
    return http.get(`/zones/${id}`)
  },

  create: async (data: Partial<Zone>): Promise<Zone> => {
    if (USE_MOCK) {
      await delay(300)
      return { id: Date.now(), name: '', meterCount: 0, totalUsage: 0, createdAt: new Date().toISOString(), sourceDocumentNo: '', remark: '', ...data } as Zone
    }
    return http.post('/zones', data)
  },

  update: async (data: Partial<Zone>): Promise<Zone> => {
    if (USE_MOCK) {
      await delay(300)
      const zone = mockZones.find((z) => z.id === data.id)
      if (!zone) throw new Error('Zone not found')
      return { ...zone, ...data }
    }
    return http.put(`/zones/${data.id}`, data)
  },

  getMeters: async (zoneId: number): Promise<Meter[]> => {
    if (USE_MOCK) {
      await delay(300)
      return mockMeters.filter((m) => m.zoneId === zoneId)
    }
    return http.get(`/zones/${zoneId}/meters`)
  },

  getEnergy: async (zoneId: number): Promise<{ usage: number; curve: EnergyCurvePoint[] }> => {
    if (USE_MOCK) {
      await delay(400)
      const zone = mockZones.find((z) => z.id === zoneId)
      return {
        usage: zone?.totalUsage || 0,
        curve: generateCurveData('month', zoneId),
      }
    }
    return http.get(`/zones/${zoneId}/energy`)
  },
}

export const alarmApi = {
  getList: async (params: { page?: number; pageSize?: number; type?: string; level?: string; status?: string; zoneId?: number }): Promise<PageResult<Alarm>> => {
    if (USE_MOCK) {
      await delay(400)
      let filtered = [...mockAlarms]
      if (params.type) filtered = filtered.filter((a) => a.type === params.type)
      if (params.level) filtered = filtered.filter((a) => a.level === params.level)
      if (params.status) filtered = filtered.filter((a) => a.status === params.status)
      if (params.zoneId) filtered = filtered.filter((a) => mockMeters.find((m) => m.id === a.meterId)?.zoneId === params.zoneId)
      const page = params.page || 1
      const pageSize = params.pageSize || 10
      return paginate(filtered, page, pageSize)
    }
    return http.get('/alarms', { params })
  },

  getById: async (id: number): Promise<Alarm> => {
    if (USE_MOCK) {
      await delay(200)
      const alarm = mockAlarms.find((a) => a.id === id)
      if (!alarm) throw new Error('Alarm not found')
      return alarm
    }
    return http.get(`/alarms/${id}`)
  },

  confirm: async (id: number): Promise<Alarm> => {
    if (USE_MOCK) {
      await delay(300)
      const alarm = mockAlarms.find((a) => a.id === id)
      if (!alarm) throw new Error('Alarm not found')
      return { ...alarm, status: 'confirmed', confirmedAt: new Date().toISOString() }
    }
    return http.post(`/alarms/${id}/confirm`)
  },

  resolve: async (id: number, data: { rootCause: string; remark?: string }): Promise<Alarm> => {
    if (USE_MOCK) {
      await delay(300)
      const alarm = mockAlarms.find((a) => a.id === id)
      if (!alarm) throw new Error('Alarm not found')
      const now = new Date()
      const occurred = new Date(alarm.occurredAt)
      const diffMinutes = Math.round((now.getTime() - occurred.getTime()) / 60000)
      return { ...alarm, status: 'resolved', resolvedAt: now.toISOString(), rootCause: data.rootCause, remark: data.remark || alarm.remark, responseDuration: diffMinutes }
    }
    return http.post(`/alarms/${id}/resolve`, data)
  },

  getReview: async (month: string): Promise<AlarmReview> => {
    if (USE_MOCK) {
      await delay(500)
      return {
        month,
        totalAlarms: 23,
        resolvedAlarms: 18,
        avgResponseMinutes: 42,
        topCauses: [
          { cause: '通信链路中断', count: 8 },
          { cause: '设备硬件故障', count: 5 },
          { cause: '负荷超限', count: 4 },
          { cause: '数据采集异常', count: 3 },
          { cause: '配置变更未同步', count: 2 },
          { cause: '其他', count: 1 },
        ],
        assigneeStats: [
          { assignee: '张工', count: 7, avgResponse: 35 },
          { assignee: '李工', count: 6, avgResponse: 48 },
          { assignee: '王工', count: 5, avgResponse: 52 },
          { assignee: '赵工', count: 3, avgResponse: 28 },
          { assignee: '孙工', count: 2, avgResponse: 40 },
        ],
        levelDistribution: { critical: 8, warning: 11, info: 4 },
      }
    }
    return http.get('/alarms/review', { params: { month } })
  },
}

export const subsidyApi = {
  getList: async (params: { page?: number; pageSize?: number; status?: string; type?: string }): Promise<PageResult<Subsidy>> => {
    if (USE_MOCK) {
      await delay(300)
      let filtered = [...mockSubsidies]
      if (params.status) filtered = filtered.filter((s) => s.status === params.status)
      if (params.type) filtered = filtered.filter((s) => s.type.includes(params.type!))
      const page = params.page || 1
      const pageSize = params.pageSize || 10
      return paginate(filtered, page, pageSize)
    }
    return http.get('/subsidies', { params })
  },

  getById: async (id: number): Promise<Subsidy> => {
    if (USE_MOCK) {
      await delay(200)
      const subsidy = mockSubsidies.find((s) => s.id === id)
      if (!subsidy) throw new Error('Subsidy not found')
      return subsidy
    }
    return http.get(`/subsidies/${id}`)
  },

  create: async (data: Partial<Subsidy>): Promise<Subsidy> => {
    if (USE_MOCK) {
      await delay(300)
      return { id: Date.now(), type: '', amount: 0, sourceDocumentNo: '', sourceDocumentUrl: '', remark: '', createdBy: '当前用户', createdAt: new Date().toISOString(), approvedBy: null, approvedAt: null, status: 'pending', ...data } as Subsidy
    }
    return http.post('/subsidies', data)
  },

  approve: async (id: number, data: { approved: boolean; remark?: string }): Promise<Subsidy> => {
    if (USE_MOCK) {
      await delay(300)
      const subsidy = mockSubsidies.find((s) => s.id === id)
      if (!subsidy) throw new Error('Subsidy not found')
      return {
        ...subsidy,
        status: data.approved ? 'approved' : 'rejected',
        approvedBy: '审批人',
        approvedAt: new Date().toISOString(),
        remark: data.remark || subsidy.remark,
      }
    }
    return http.post(`/subsidies/${id}/approve`, data)
  },
}

export const dataApi = {
  query: async (params: DataQueryParams): Promise<DataQueryResult> => {
    if (USE_MOCK) {
      await delay(600)
      const items: DataQueryResult['items'] = []
      const start = new Date(params.startTime)
      const end = new Date(params.endTime)
      const zoneName = params.zoneId ? mockZones.find((z) => z.id === params.zoneId)?.name || '未知区域' : '全园区'
      const meterNo = params.meterId ? mockMeters.find((m) => m.id === params.meterId)?.meterNo || 'ALL' : 'ALL'
      const baseMultiplier = params.zoneId === 2 ? 2.5 : 1

      const stepMs = params.granularity === 'hour' ? 3600000 : params.granularity === 'day' ? 86400000 : 30 * 86400000
      const maxPoints = 48
      let count = 0
      for (let t = start.getTime(); t <= end.getTime() && count < maxPoints; t += stepMs) {
        const d = new Date(t)
        const h = d.getHours()
        const isPeak = h >= 8 && h <= 11 || h >= 17 && h <= 21
        const baseVal = isPeak ? 150 + Math.random() * 100 : 30 + Math.random() * 50
        const value = Math.round(baseVal * baseMultiplier * 10) / 10
        const timeStr = params.granularity === 'month'
          ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          : params.granularity === 'day'
            ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(h).padStart(2, '0')}:00`

        items.push({ time: timeStr, meterNo, zoneName, value, unit: 'kWh' })
        count++
      }

      return { total: items.length, items }
    }
    return http.get('/data/query', { params })
  },

  export: async (params: DataQueryParams): Promise<Blob> => {
    if (USE_MOCK) {
      await delay(800)
      const result = await dataApi.query(params)
      const header = '时间,电表号,区域,数值,单位\n'
      const rows = result.items.map((i) => `${i.time},${i.meterNo},${i.zoneName},${i.value},${i.unit}`).join('\n')
      return new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    }
    return http.get('/data/export', { params, responseType: 'blob' })
  },
}

export const syncApi = {
  getTasks: async (params: { page?: number; pageSize?: number; status?: string; type?: string; meterNo?: string }): Promise<PageResult<SyncTask>> => {
    if (USE_MOCK) {
      await delay(400)
      let filtered = [...mockSyncTasks]
      if (params.status) filtered = filtered.filter((t) => t.status === params.status)
      if (params.type) filtered = filtered.filter((t) => t.type === params.type)
      if (params.meterNo) filtered = filtered.filter((t) => t.meterNo.includes(params.meterNo!))
      const page = params.page || 1
      const pageSize = params.pageSize || 10
      return paginate(filtered, page, pageSize)
    }
    return http.get('/sync/tasks', { params })
  },

  getTaskById: async (id: number): Promise<SyncTask> => {
    if (USE_MOCK) {
      await delay(200)
      const task = mockSyncTasks.find((t) => t.id === id)
      if (!task) throw new Error('Sync task not found')
      return task
    }
    return http.get(`/sync/tasks/${id}`)
  },

  retry: async (id: number): Promise<SyncTask> => {
    if (USE_MOCK) {
      await delay(1000)
      const task = mockSyncTasks.find((t) => t.id === id)
      if (!task) throw new Error('Sync task not found')
      const success = Math.random() > 0.4
      const now = new Date().toISOString()
      const newRetryResult = { retryAt: now, success, message: success ? '重试成功，数据已同步' : '重试失败，请检查网络连接后再次尝试' }
      return {
        ...task,
        status: success ? 'success' : 'failed',
        retryCount: task.retryCount + 1,
        retryResults: [...task.retryResults, newRetryResult],
        completedAt: now,
        duration: success ? Math.floor(Math.random() * 15 + 5) : null,
      }
    }
    return http.post(`/sync/tasks/${id}/retry`)
  },
}

export const authApi = {
  login: async (username: string, _password: string): Promise<{ token: string; user: UserInfo }> => {
    if (USE_MOCK) {
      await delay(500)
      const users: Record<string, UserInfo> = {
        admin: { id: 1, username: 'admin', role: 'admin', realName: '系统管理员' },
        manager: { id: 2, username: 'manager', role: 'manager', realName: '能源主管' },
        operator: { id: 3, username: 'operator', role: 'operator', realName: '运维人员' },
      }
      const user = users[username] || users['operator']
      return { token: `mock-jwt-token-${user.role}-${Date.now()}`, user }
    }
    return http.post('/auth/login', { username, password: _password })
  },

  logout: async (): Promise<void> => {
    if (USE_MOCK) {
      await delay(200)
      localStorage.removeItem('token')
      return
    }
    return http.post('/auth/logout')
  },
}
