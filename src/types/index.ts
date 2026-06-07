export interface QualityMetrics {
  totalSamples: number
  validSamples: number
  anomalyRate: number
  avgDuration: number
  skipRate: number
  duplicateRate: number
  ipAbnormalRate: number
  deviceAbnormalRate: number
  qualityMarkRate: number
}

export type DimensionType = 'survey' | 'channel' | 'questionGroup' | 'region' | 'device'

export interface Dimension {
  id: string
  name: string
  type: DimensionType
  code: string
}

export interface FunnelData {
  stage: string
  stageCode: string
  count: number
  conversionRate: number
  dropRate: number
}

export interface AnomalyMatrixCell {
  channelId: string
  channelName: string
  anomalyType: string
  anomalyTypeName: string
  count: number
  rate: number
  level: 'low' | 'medium' | 'high' | 'critical'
}

export interface ChannelRanking {
  rank: number
  channelId: string
  channelName: string
  totalSamples: number
  qualityScore: number
  anomalyRate: number
  avgDuration: number
  trend: 'up' | 'down' | 'flat'
}

export interface QuestionGroupDuration {
  groupId: string
  groupName: string
  min: number
  q1: number
  median: number
  q3: number
  max: number
  outliers: number[]
  mean: number
}

export interface AnomalySample {
  sampleId: string
  surveyId: string
  surveyName: string
  channelId: string
  channelName: string
  region: string
  deviceType: string
  duration: number
  skipCount: number
  totalQuestions: number
  anomalyTypes: string[]
  qualityMark: 'pass' | 'warning' | 'fail'
  submitTime: string
  hasNote: boolean
}

export interface AnswerTrajectory {
  questionId: string
  questionTitle: string
  groupId: string
  startTime: number
  endTime: number
  duration: number
  isSkipped: boolean
  answerValue: string
}

export interface ManualNote {
  noteId: string
  targetType: 'sample' | 'channel' | 'anomaly'
  targetId: string
  content: string
  tags: string[]
  author: string
  createTime: string
  updateTime: string
}

export interface QualityCheckHit {
  ruleId: string
  ruleName: string
  ruleDescription: string
  hitValue: string
  threshold: string
  severity: 'low' | 'medium' | 'high'
}

export interface TrendDataPoint {
  date: string
  anomalyCount: number
  anomalyRate: number
  totalSamples: number
}

export interface FilterState {
  timeRange: {
    start: string
    end: string
  }
  selectedSurveys: string[]
  selectedChannels: string[]
  selectedRegions: string[]
  selectedDevices: string[]
  selectedQuestionGroups: string[]
  anomalyTypes: string[]
  qualityMarks: string[]
}

export interface ComparisonData {
  dimension: string
  dimensionValue: string
  metrics: Partial<QualityMetrics>
}

export type MetricKey = keyof QualityMetrics

export interface MetricDefinition {
  key: MetricKey
  name: string
  description: string
  formula: string
  unit: string
  isPercentage: boolean
}
