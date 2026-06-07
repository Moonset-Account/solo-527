import type {
  SensorReading,
  SensorStatus,
  Alert,
  FeedingRecord,
  PondBatch,
  AeratorStatus,
  Threshold,
  ProcessingNote,
  MetricType,
  Quality,
} from '@/types'

function uuid(): string {
  return Math.random().toString(36).substring(2, 15)
}

function formatTs(d: Date): string {
  return d.toISOString()
}

const now = new Date()
const HOUR = 3600000
const DAY = 86400000

export function generateSensorReadings(
  pondId: string,
  metric: MetricType,
  hours: number = 24
): SensorReading[] {
  const readings: SensorReading[] = []
  const count = hours * 6
  const baseValues: Record<MetricType, number> = {
    dissolved_oxygen: 7.2,
    temperature: 26.5,
    ph: 7.8,
  }
  const ranges: Record<MetricType, number> = {
    dissolved_oxygen: 1.5,
    temperature: 3,
    ph: 0.6,
  }
  const base = baseValues[metric]
  const range = ranges[metric]

  const offlineStart = hours * 0.55
  const offlineEnd = hours * 0.62

  for (let i = 0; i < count; i++) {
    const ts = new Date(now.getTime() - (count - i) * 10 * 60000)
    const hourIndex = i / 6
    let quality: Quality = 'good'
    let isAnomaly = false
    let value = base + (Math.random() - 0.5) * range

    if (hourIndex >= offlineStart && hourIndex <= offlineEnd) {
      quality = 'offline'
      value = NaN
    }

    if (metric === 'dissolved_oxygen' && hourIndex > 12 && hourIndex < 14) {
      value = 4.2 + Math.random() * 0.3
      isAnomaly = true
      quality = 'suspect'
    }

    if (metric === 'temperature' && hourIndex > 8 && hourIndex < 9) {
      value = 31.5 + Math.random() * 0.5
      isAnomaly = true
      quality = 'suspect'
    }

    readings.push({
      id: uuid(),
      sensorId: `${pondId}-${metric}-sensor`,
      pondId,
      metric,
      value: quality === 'offline' ? NaN : Math.round(value * 100) / 100,
      timestamp: formatTs(ts),
      isAnomaly,
      quality,
    })
  }
  return readings
}

export const mockSensorStatuses: SensorStatus[] = [
  { sensorId: 'pond-1-dissolved_oxygen-sensor', pondId: 'pond-1', type: 'dissolved_oxygen', status: 'online', lastHeartbeat: formatTs(now), lastReading: 7.1 },
  { sensorId: 'pond-1-temperature-sensor', pondId: 'pond-1', type: 'temperature', status: 'online', lastHeartbeat: formatTs(now), lastReading: 26.3 },
  { sensorId: 'pond-1-ph-sensor', pondId: 'pond-1', type: 'ph', status: 'offline', lastHeartbeat: formatTs(new Date(now.getTime() - 2 * HOUR)), lastReading: null },
  { sensorId: 'pond-2-dissolved_oxygen-sensor', pondId: 'pond-2', type: 'dissolved_oxygen', status: 'online', lastHeartbeat: formatTs(now), lastReading: 6.8 },
  { sensorId: 'pond-2-temperature-sensor', pondId: 'pond-2', type: 'temperature', status: 'online', lastHeartbeat: formatTs(now), lastReading: 25.9 },
  { sensorId: 'pond-2-ph-sensor', pondId: 'pond-2', type: 'ph', status: 'online', lastHeartbeat: formatTs(now), lastReading: 7.5 },
  { sensorId: 'pond-3-dissolved_oxygen-sensor', pondId: 'pond-3', type: 'dissolved_oxygen', status: 'offline', lastHeartbeat: formatTs(new Date(now.getTime() - 4 * HOUR)), lastReading: null },
  { sensorId: 'pond-3-temperature-sensor', pondId: 'pond-3', type: 'temperature', status: 'online', lastHeartbeat: formatTs(now), lastReading: 27.1 },
  { sensorId: 'pond-3-ph-sensor', pondId: 'pond-3', type: 'ph', status: 'online', lastHeartbeat: formatTs(now), lastReading: 8.1 },
  { sensorId: 'pond-4-dissolved_oxygen-sensor', pondId: 'pond-4', type: 'dissolved_oxygen', status: 'online', lastHeartbeat: formatTs(now), lastReading: 7.5 },
  { sensorId: 'pond-4-temperature-sensor', pondId: 'pond-4', type: 'temperature', status: 'online', lastHeartbeat: formatTs(now), lastReading: 26.0 },
  { sensorId: 'pond-4-ph-sensor', pondId: 'pond-4', type: 'ph', status: 'online', lastHeartbeat: formatTs(now), lastReading: 7.9 },
]

export const mockAlerts: Alert[] = [
  {
    id: 'alert-1',
    type: 'threshold',
    severity: 'critical',
    metric: 'dissolved_oxygen',
    pondId: 'pond-1',
    value: 4.2,
    threshold: 5.0,
    triggeredAt: formatTs(new Date(now.getTime() - 3 * HOUR)),
    status: 'pending',
    acknowledgedBy: null,
    acknowledgedAt: null,
    humanJudgment: null,
    judgmentNote: null,
  },
  {
    id: 'alert-2',
    type: 'threshold',
    severity: 'warning',
    metric: 'temperature',
    pondId: 'pond-1',
    value: 31.5,
    threshold: 30.0,
    triggeredAt: formatTs(new Date(now.getTime() - 5 * HOUR)),
    status: 'acknowledged',
    acknowledgedBy: '张技术员',
    acknowledgedAt: formatTs(new Date(now.getTime() - 4 * HOUR)),
    humanJudgment: 'real_anomaly',
    judgmentNote: '午后高温导致水温超标，已开启增氧机降温',
  },
  {
    id: 'alert-3',
    type: 'offline',
    severity: 'critical',
    metric: 'ph',
    pondId: 'pond-1',
    value: 0,
    threshold: 0,
    triggeredAt: formatTs(new Date(now.getTime() - 2 * HOUR)),
    status: 'pending',
    acknowledgedBy: null,
    acknowledgedAt: null,
    humanJudgment: null,
    judgmentNote: null,
  },
  {
    id: 'alert-4',
    type: 'offline',
    severity: 'warning',
    metric: 'dissolved_oxygen',
    pondId: 'pond-3',
    value: 0,
    threshold: 0,
    triggeredAt: formatTs(new Date(now.getTime() - 4 * HOUR)),
    status: 'acknowledged',
    acknowledgedBy: '李技术员',
    acknowledgedAt: formatTs(new Date(now.getTime() - 3 * HOUR)),
    humanJudgment: 'needs_onsite',
    judgmentNote: '3号塘溶氧传感器疑似故障，需现场检查',
  },
  {
    id: 'alert-5',
    type: 'threshold',
    severity: 'warning',
    metric: 'ph',
    pondId: 'pond-3',
    value: 8.9,
    threshold: 8.5,
    triggeredAt: formatTs(new Date(now.getTime() - 1 * HOUR)),
    status: 'pending',
    acknowledgedBy: null,
    acknowledgedAt: null,
    humanJudgment: null,
    judgmentNote: null,
  },
  {
    id: 'alert-6',
    type: 'threshold',
    severity: 'critical',
    metric: 'dissolved_oxygen',
    pondId: 'pond-2',
    value: 4.8,
    threshold: 5.0,
    triggeredAt: formatTs(new Date(now.getTime() - 0.5 * HOUR)),
    status: 'pending',
    acknowledgedBy: null,
    acknowledgedAt: null,
    humanJudgment: null,
    judgmentNote: null,
  },
]

export const mockFeedingRecords: FeedingRecord[] = [
  {
    id: 'feed-1',
    pondId: 'pond-1',
    batchId: 'batch-1',
    amount: 25,
    feedType: '颗粒料',
    timestamp: formatTs(new Date(now.getTime() - 20 * HOUR)),
    strategyChange: false,
    strategyNote: null,
  },
  {
    id: 'feed-2',
    pondId: 'pond-1',
    batchId: 'batch-1',
    amount: 30,
    feedType: '颗粒料',
    timestamp: formatTs(new Date(now.getTime() - 16 * HOUR)),
    strategyChange: false,
    strategyNote: null,
  },
  {
    id: 'feed-3',
    pondId: 'pond-1',
    batchId: 'batch-1',
    amount: 20,
    feedType: '粉料',
    timestamp: formatTs(new Date(now.getTime() - 12 * HOUR)),
    strategyChange: true,
    strategyNote: '因溶氧偏低，改用粉料减少耗氧，投喂量减少33%',
  },
  {
    id: 'feed-4',
    pondId: 'pond-1',
    batchId: 'batch-1',
    amount: 28,
    feedType: '颗粒料',
    timestamp: formatTs(new Date(now.getTime() - 8 * HOUR)),
    strategyChange: true,
    strategyNote: '溶氧恢复，恢复颗粒料，投喂量恢复至28kg',
  },
  {
    id: 'feed-5',
    pondId: 'pond-2',
    batchId: 'batch-2',
    amount: 22,
    feedType: '颗粒料',
    timestamp: formatTs(new Date(now.getTime() - 18 * HOUR)),
    strategyChange: false,
    strategyNote: null,
  },
  {
    id: 'feed-6',
    pondId: 'pond-2',
    batchId: 'batch-2',
    amount: 22,
    feedType: '颗粒料',
    timestamp: formatTs(new Date(now.getTime() - 6 * HOUR)),
    strategyChange: false,
    strategyNote: null,
  },
  {
    id: 'feed-7',
    pondId: 'pond-3',
    batchId: 'batch-3',
    amount: 18,
    feedType: '颗粒料',
    timestamp: formatTs(new Date(now.getTime() - 14 * HOUR)),
    strategyChange: false,
    strategyNote: null,
  },
  {
    id: 'feed-8',
    pondId: 'pond-4',
    batchId: 'batch-4',
    amount: 35,
    feedType: '膨化料',
    timestamp: formatTs(new Date(now.getTime() - 10 * HOUR)),
    strategyChange: false,
    strategyNote: null,
  },
]

export const mockBatches: PondBatch[] = [
  { id: 'batch-1', pondId: 'pond-1', batchName: '1号塘-草鱼2024春', species: '草鱼', startDate: '2024-03-15', endDate: null, status: 'active' },
  { id: 'batch-2', pondId: 'pond-2', batchName: '2号塘-鲤鱼2024春', species: '鲤鱼', startDate: '2024-03-20', endDate: null, status: 'active' },
  { id: 'batch-3', pondId: 'pond-3', batchName: '3号塘-鲫鱼2024春', species: '鲫鱼', startDate: '2024-04-01', endDate: null, status: 'active' },
  { id: 'batch-4', pondId: 'pond-4', batchName: '4号塘-鲈鱼2024春', species: '鲈鱼', startDate: '2024-04-10', endDate: null, status: 'active' },
  { id: 'batch-5', pondId: 'pond-1', batchName: '1号塘-草鱼2023秋', species: '草鱼', startDate: '2023-09-01', endDate: '2024-01-15', status: 'harvested' },
  { id: 'batch-6', pondId: 'pond-2', batchName: '2号塘-鲤鱼2023秋', species: '鲤鱼', startDate: '2023-09-10', endDate: '2024-01-20', status: 'harvested' },
]

export const mockAeratorStatuses: AeratorStatus[] = [
  { id: 'aerator-1', pondId: 'pond-1', status: 'running', lastSwitchAt: formatTs(new Date(now.getTime() - 2 * HOUR)), autoMode: true },
  { id: 'aerator-2', pondId: 'pond-2', status: 'stopped', lastSwitchAt: formatTs(new Date(now.getTime() - 8 * HOUR)), autoMode: true },
  { id: 'aerator-3', pondId: 'pond-3', status: 'running', lastSwitchAt: formatTs(new Date(now.getTime() - 1 * HOUR)), autoMode: true },
  { id: 'aerator-4', pondId: 'pond-4', status: 'fault', lastSwitchAt: formatTs(new Date(now.getTime() - 6 * HOUR)), autoMode: false },
]

export const mockThresholds: Threshold[] = [
  { id: 'th-1', metric: 'dissolved_oxygen', pondId: 'pond-1', warningLow: 5.5, warningHigh: 12.0, criticalLow: 5.0, criticalHigh: 14.0 },
  { id: 'th-2', metric: 'temperature', pondId: 'pond-1', warningLow: 15.0, warningHigh: 30.0, criticalLow: 10.0, criticalHigh: 33.0 },
  { id: 'th-3', metric: 'ph', pondId: 'pond-1', warningLow: 6.5, warningHigh: 8.5, criticalLow: 6.0, criticalHigh: 9.0 },
  { id: 'th-4', metric: 'dissolved_oxygen', pondId: 'pond-2', warningLow: 5.5, warningHigh: 12.0, criticalLow: 5.0, criticalHigh: 14.0 },
  { id: 'th-5', metric: 'temperature', pondId: 'pond-2', warningLow: 15.0, warningHigh: 30.0, criticalLow: 10.0, criticalHigh: 33.0 },
  { id: 'th-6', metric: 'ph', pondId: 'pond-2', warningLow: 6.5, warningHigh: 8.5, criticalLow: 6.0, criticalHigh: 9.0 },
  { id: 'th-7', metric: 'dissolved_oxygen', pondId: 'pond-3', warningLow: 5.5, warningHigh: 12.0, criticalLow: 5.0, criticalHigh: 14.0 },
  { id: 'th-8', metric: 'temperature', pondId: 'pond-3', warningLow: 15.0, warningHigh: 30.0, criticalLow: 10.0, criticalHigh: 33.0 },
  { id: 'th-9', metric: 'ph', pondId: 'pond-3', warningLow: 6.5, warningHigh: 8.5, criticalLow: 6.0, criticalHigh: 9.0 },
  { id: 'th-10', metric: 'dissolved_oxygen', pondId: 'pond-4', warningLow: 5.0, warningHigh: 12.0, criticalLow: 4.5, criticalHigh: 14.0 },
  { id: 'th-11', metric: 'temperature', pondId: 'pond-4', warningLow: 18.0, warningHigh: 32.0, criticalLow: 12.0, criticalHigh: 35.0 },
  { id: 'th-12', metric: 'ph', pondId: 'pond-4', warningLow: 6.5, warningHigh: 8.5, criticalLow: 6.0, criticalHigh: 9.0 },
]

export const mockProcessingNotes: ProcessingNote[] = [
  {
    id: 'note-1',
    alertId: 'alert-2',
    readingId: null,
    note: '午后高温导致水温超标，已开启增氧机降温',
    createdBy: '张技术员',
    createdAt: formatTs(new Date(now.getTime() - 4 * HOUR)),
  },
  {
    id: 'note-2',
    alertId: 'alert-4',
    readingId: null,
    note: '3号塘溶氧传感器疑似故障，需现场检查',
    createdBy: '李技术员',
    createdAt: formatTs(new Date(now.getTime() - 3 * HOUR)),
  },
  {
    id: 'note-3',
    alertId: 'alert-2',
    readingId: null,
    note: '增氧机开启2小时后水温已恢复至29.2°C',
    createdBy: '张技术员',
    createdAt: formatTs(new Date(now.getTime() - 2 * HOUR)),
  },
]

let readingsCache: Map<string, SensorReading[]> = new Map()

export function getMockReadings(pondId: string, metric: MetricType): SensorReading[] {
  const key = `${pondId}-${metric}`
  if (!readingsCache.has(key)) {
    readingsCache.set(key, generateSensorReadings(pondId, metric, 24))
  }
  return readingsCache.get(key)!
}

export function clearReadingsCache(): void {
  readingsCache = new Map()
}
