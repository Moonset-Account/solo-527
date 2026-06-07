import type { MetricConfig } from '@/types'

export const METRIC_CONFIGS: MetricConfig[] = [
  {
    key: 'totalDowntime',
    label: '总停机时长',
    unit: '分钟',
    plannedOnly: false,
    unplannedOnly: false,
    aggregation: 'sum',
    decimalPlaces: 0,
  },
  {
    key: 'downtimeCount',
    label: '停机次数',
    unit: '次',
    plannedOnly: false,
    unplannedOnly: false,
    aggregation: 'count',
    decimalPlaces: 0,
  },
  {
    key: 'avgRepairDuration',
    label: '平均修复时长',
    unit: '分钟',
    plannedOnly: false,
    unplannedOnly: false,
    aggregation: 'avg',
    decimalPlaces: 1,
  },
  {
    key: 'plannedRatio',
    label: '计划停机占比',
    unit: '%',
    plannedOnly: false,
    unplannedOnly: false,
    aggregation: 'sum',
    decimalPlaces: 1,
  },
  {
    key: 'mtbf',
    label: 'MTBF',
    unit: '小时',
    plannedOnly: false,
    unplannedOnly: true,
    aggregation: 'avg',
    decimalPlaces: 1,
  },
  {
    key: 'mttr',
    label: 'MTTR',
    unit: '小时',
    plannedOnly: false,
    unplannedOnly: false,
    aggregation: 'avg',
    decimalPlaces: 1,
  },
]

export function formatMetricValue(key: string, value: number): string {
  const config = METRIC_CONFIGS.find(c => c.key === key)
  if (!config) return String(value)
  return value.toFixed(config.decimalPlaces)
}
