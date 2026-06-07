export type Perspective = 'shift' | 'slot' | 'route' | 'device' | 'time'
export type Granularity = 'hour' | 'day'

export interface FilterState {
  dateStart: string
  dateEnd: string
  shift: string
  slot: string
  route: string
  device: string
  granularity: Granularity
  perspective: Perspective
}

export interface SummaryData {
  total_packages: number
  total_sorted: number
  total_errors: number
  error_rate: number
  alarm_count: number
  review_failed: number
  error_rate_change: number
  alarm_count_change: number
}

export interface AlarmPeriod {
  device: string
  alarm_type: string
  start_time: string
  end_time: string
  duration_minutes: number
}

export interface TrendData {
  timestamps: string[]
  error_counts: number[]
  error_rates: number[]
  total_counts: number[]
  alarm_periods: AlarmPeriod[]
}

export interface HeatmapData {
  slots: string[]
  time_periods: string[]
  values: number[][]
}

export interface ShiftRankItem {
  shift: string
  total_sorted: number
  error_count: number
  error_rate: number
  alarm_count: number
  rank: number
}

export interface ShiftRankData {
  data: ShiftRankItem[]
}

export interface SankeyNode {
  name: string
  category: string
}

export interface SankeyLink {
  source: string
  target: string
  value: number
}

export interface AlarmCorrelationData {
  nodes: SankeyNode[]
  links: SankeyLink[]
}

export interface MetricDefinition {
  key: string
  name: string
  formula: string
  description: string
  unit: string
  threshold_warning: number
  threshold_critical: number
}

export interface MetricsConfig {
  metrics: MetricDefinition[]
}
