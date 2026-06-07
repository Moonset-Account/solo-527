export type MetricType = 'dissolved_oxygen' | 'temperature' | 'ph'

export type Quality = 'good' | 'suspect' | 'offline'

export type AlertType = 'threshold' | 'offline'

export type AlertSeverity = 'warning' | 'critical'

export type AlertStatus = 'pending' | 'acknowledged' | 'resolved'

export type HumanJudgment = 'false_alarm' | 'real_anomaly' | 'needs_onsite'

export type AeratorStatusType = 'running' | 'stopped' | 'fault'

export type BatchStatus = 'active' | 'harvested'

export type SensorOnlineStatus = 'online' | 'offline'

export interface SensorReading {
  id: string
  sensorId: string
  pondId: string
  metric: MetricType
  value: number
  timestamp: string
  isAnomaly: boolean
  quality: Quality
}

export interface SensorStatus {
  sensorId: string
  pondId: string
  type: string
  status: SensorOnlineStatus
  lastHeartbeat: string
  lastReading: number | null
}

export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  metric: string
  pondId: string
  value: number
  threshold: number
  triggeredAt: string
  status: AlertStatus
  acknowledgedBy: string | null
  acknowledgedAt: string | null
  humanJudgment: HumanJudgment | null
  judgmentNote: string | null
}

export interface AcknowledgePayload {
  alertId: string
  judgment: HumanJudgment
  note?: string
}

export interface FeedingRecord {
  id: string
  pondId: string
  batchId: string
  amount: number
  feedType: string
  timestamp: string
  strategyChange: boolean
  strategyNote: string | null
}

export interface PondBatch {
  id: string
  pondId: string
  batchName: string
  species: string
  startDate: string
  endDate: string | null
  status: BatchStatus
}

export interface AeratorStatus {
  id: string
  pondId: string
  status: AeratorStatusType
  lastSwitchAt: string
  autoMode: boolean
}

export interface Threshold {
  id: string
  metric: MetricType
  pondId: string
  warningLow: number
  warningHigh: number
  criticalLow: number
  criticalHigh: number
}

export interface ProcessingNote {
  id: string
  alertId: string | null
  readingId: string | null
  note: string
  createdBy: string
  createdAt: string
}

export interface FilterState {
  timeRange: [string, string]
  selectedPonds: string[]
  selectedMetrics: MetricType[]
  selectedBatches: string[]
}

export const METRIC_LABELS: Record<MetricType, string> = {
  dissolved_oxygen: '溶氧量 (mg/L)',
  temperature: '温度 (°C)',
  ph: 'pH',
}

export const METRIC_UNITS: Record<MetricType, string> = {
  dissolved_oxygen: 'mg/L',
  temperature: '°C',
  ph: '',
}

export const METRIC_COLORS: Record<MetricType, string> = {
  dissolved_oxygen: '#00B4D8',
  temperature: '#F59E0B',
  ph: '#10B981',
}

export const JUDGMENT_LABELS: Record<HumanJudgment, string> = {
  false_alarm: '误报',
  real_anomaly: '真实异常',
  needs_onsite: '需现场排查',
}

export const POND_LIST = ['pond-1', 'pond-2', 'pond-3', 'pond-4']
export const POND_NAMES: Record<string, string> = {
  'pond-1': '1号塘',
  'pond-2': '2号塘',
  'pond-3': '3号塘',
  'pond-4': '4号塘',
}
