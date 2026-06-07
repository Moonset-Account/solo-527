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

export interface SourceTableConfig {
  name: string
  label: string
  recordCount: number
  primaryKey: string
  joinKeys: string[]
  cleaningRules: string[]
}

export const SOURCE_TABLE_CONFIGS: SourceTableConfig[] = [
  {
    name: 'equipment_runtime',
    label: '设备运行表',
    recordCount: 2000,
    primaryKey: 'id',
    joinKeys: ['equipmentId', 'timestamp'],
    cleaningRules: ['fill_productionLine', 'fill_shift', 'derive_equipmentName'],
  },
  {
    name: 'alarm_records',
    label: '报警记录表',
    recordCount: 500,
    primaryKey: 'id',
    joinKeys: ['equipmentId', 'alarmTime'],
    cleaningRules: ['match_by_equipmentId_time_proximity', 'cross_validate_faultType', 'drop_unknown_equipment'],
  },
  {
    name: 'maintenance_orders',
    label: '维修工单表',
    recordCount: 320,
    primaryKey: 'id',
    joinKeys: ['equipmentId', 'startTime'],
    cleaningRules: ['drop_missing_equipmentId', 'drop_missing_faultType', 'drop_zero_repairDuration', 'deduplicate_by_id'],
  },
  {
    name: 'shift_groups',
    label: '班组表',
    recordCount: 90,
    primaryKey: 'id',
    joinKeys: ['scheduleDate', 'shiftName'],
    cleaningRules: ['match_by_date_and_shiftName', 'attach_leader'],
  },
  {
    name: 'production_output',
    label: '产量表',
    recordCount: 360,
    primaryKey: 'id',
    joinKeys: ['productionLine', 'date', 'shift'],
    cleaningRules: ['validate_productionLine', 'compute_yield_rate'],
  },
  {
    name: 'spare_part_consumption',
    label: '备件消耗表',
    recordCount: 250,
    primaryKey: 'id',
    joinKeys: ['workOrderId'],
    cleaningRules: ['group_by_workOrderId', 'attach_to_maintenance_order', 'drop_orphan_records'],
  },
]

export function formatMetricValue(key: string, value: number): string {
  const config = METRIC_CONFIGS.find(c => c.key === key)
  if (!config) return String(value)
  return value.toFixed(config.decimalPlaces)
}
