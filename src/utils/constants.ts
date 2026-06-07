import type { MetricDefinition, DimensionType } from '@/types'

export const ANOMALY_TYPES = [
  { code: 'duration', name: '答题时长异常' },
  { code: 'skip', name: '高跳题率' },
  { code: 'ip', name: 'IP 异常' },
  { code: 'device', name: '设备异常' },
  { code: 'duplicate', name: '重复提交' },
  { code: 'quality', name: '质检标记' },
]

export const DIMENSION_TYPES: { type: DimensionType; name: string }[] = [
  { type: 'survey', name: '问卷' },
  { type: 'channel', name: '渠道' },
  { type: 'questionGroup', name: '题组' },
  { type: 'region', name: '地区' },
  { type: 'device', name: '设备类型' },
]

export const METRIC_DEFINITIONS: MetricDefinition[] = [
  {
    key: 'totalSamples',
    name: '总样本量',
    description: '统计周期内提交的所有问卷样本总数',
    formula: 'COUNT(DISTINCT sample_id)',
    unit: '份',
    isPercentage: false,
  },
  {
    key: 'validSamples',
    name: '有效样本量',
    description: '通过基础质量校验的样本数量',
    formula: 'COUNT(sample_id) WHERE quality_mark IN (\'pass\', \'warning\')',
    unit: '份',
    isPercentage: false,
  },
  {
    key: 'anomalyRate',
    name: '异常率',
    description: '被标记为异常的样本占总样本的比例',
    formula: '异常样本数 / 总样本数 × 100%',
    unit: '%',
    isPercentage: true,
  },
  {
    key: 'avgDuration',
    name: '平均答题时长',
    description: '所有有效样本答题时长的中位数',
    formula: 'MEDIAN(duration) WHERE quality_mark = \'pass\'',
    unit: '秒',
    isPercentage: false,
  },
  {
    key: 'skipRate',
    name: '跳题率',
    description: '跳题总次数占总答题次数的比例',
    formula: '跳题总次数 / (样本数 × 总题数) × 100%',
    unit: '%',
    isPercentage: true,
  },
  {
    key: 'duplicateRate',
    name: '重复提交率',
    description: '检测为重复提交的样本占比',
    formula: '(总样本数 - 去重样本数) / 总样本数 × 100%',
    unit: '%',
    isPercentage: true,
  },
  {
    key: 'ipAbnormalRate',
    name: 'IP 异常率',
    description: 'IP 归属地或集中度异常的样本占比',
    formula: 'IP 异常样本数 / 总样本数 × 100%',
    unit: '%',
    isPercentage: true,
  },
  {
    key: 'deviceAbnormalRate',
    name: '设备异常率',
    description: '设备指纹检测异常的样本占比',
    formula: '设备异常样本数 / 总样本数 × 100%',
    unit: '%',
    isPercentage: true,
  },
  {
    key: 'qualityMarkRate',
    name: '质检标记率',
    description: '人工质检标记的样本占比',
    formula: '质检标记样本数 / 总样本数 × 100%',
    unit: '%',
    isPercentage: true,
  },
]

export const COLORS = {
  primary: '#06B6D4',
  secondary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  background: '#0F172A',
  surface: '#1E293B',
  surfaceHover: '#334155',
  border: '#475569',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
}

export const ANOMALY_LEVEL_COLORS: Record<string, string> = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#F97316',
  critical: '#EF4444',
}

export const QUALITY_MARK_COLORS: Record<string, string> = {
  pass: '#10B981',
  warning: '#F59E0B',
  fail: '#EF4444',
}
