import type {
  QualityMetrics,
  FunnelData,
  AnomalyMatrixCell,
  ChannelRanking,
  QuestionGroupDuration,
  AnomalySample,
  AnswerTrajectory,
  ManualNote,
  QualityCheckHit,
  TrendDataPoint,
  Dimension,
  ComparisonData,
} from '@/types'

export const mockDimensions: Dimension[] = [
  { id: 's1', name: '用户满意度调研 Q2', type: 'survey', code: 'SAT-Q2-2024' },
  { id: 's2', name: '产品使用反馈调研', type: 'survey', code: 'PRD-FB-2024' },
  { id: 's3', name: '品牌认知度调研', type: 'survey', code: 'BRAND-AWARE-2024' },
  { id: 'c1', name: '微信朋友圈', type: 'channel', code: 'WECHAT-MOMENTS' },
  { id: 'c2', name: '微博推广', type: 'channel', code: 'WEIBO' },
  { id: 'c3', name: '抖音信息流', type: 'channel', code: 'DOUYIN' },
  { id: 'c4', name: '小红书', type: 'channel', code: 'XHS' },
  { id: 'c5', name: '短信推送', type: 'channel', code: 'SMS' },
  { id: 'c6', name: 'APP 弹窗', type: 'channel', code: 'APP-POPUP' },
  { id: 'r1', name: '华东地区', type: 'region', code: 'EAST' },
  { id: 'r2', name: '华南地区', type: 'region', code: 'SOUTH' },
  { id: 'r3', name: '华北地区', type: 'region', code: 'NORTH' },
  { id: 'r4', name: '华中地区', type: 'region', code: 'CENTRAL' },
  { id: 'r5', name: '西南地区', type: 'region', code: 'SOUTHWEST' },
  { id: 'd1', name: 'iOS', type: 'device', code: 'IOS' },
  { id: 'd2', name: 'Android', type: 'device', code: 'ANDROID' },
  { id: 'd3', name: 'PC 端', type: 'device', code: 'PC' },
  { id: 'd4', name: 'H5 移动端', type: 'device', code: 'H5' },
  { id: 'g1', name: '基本信息题组', type: 'questionGroup', code: 'BASIC-INFO' },
  { id: 'g2', name: '产品使用题组', type: 'questionGroup', code: 'PRODUCT-USAGE' },
  { id: 'g3', name: '满意度评价题组', type: 'questionGroup', code: 'SATISFACTION' },
  { id: 'g4', name: '开放建议题组', type: 'questionGroup', code: 'OPEN-SUGGESTION' },
]

export const mockQualityMetrics: QualityMetrics = {
  totalSamples: 128563,
  validSamples: 115428,
  anomalyRate: 0.102,
  avgDuration: 312,
  skipRate: 0.058,
  duplicateRate: 0.032,
  ipAbnormalRate: 0.021,
  deviceAbnormalRate: 0.018,
  qualityMarkRate: 0.045,
}

export const mockFunnelData: FunnelData[] = [
  { stage: '问卷分发', stageCode: 'distributed', count: 500000, conversionRate: 1, dropRate: 0 },
  { stage: '开始答题', stageCode: 'started', count: 186540, conversionRate: 0.373, dropRate: 0.627 },
  { stage: '完成提交', stageCode: 'submitted', count: 128563, conversionRate: 0.689, dropRate: 0.311 },
  { stage: '通过质检', stageCode: 'passed', count: 115428, conversionRate: 0.898, dropRate: 0.102 },
]

export const mockTrendData: TrendDataPoint[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date()
  date.setDate(date.getDate() - (29 - i))
  const total = 3000 + Math.floor(Math.random() * 2000)
  const anomalyCount = Math.floor(total * (0.08 + Math.random() * 0.06))
  return {
    date: date.toISOString().split('T')[0],
    totalSamples: total,
    anomalyCount,
    anomalyRate: anomalyCount / total,
  }
})

const channels = ['微信朋友圈', '微博推广', '抖音信息流', '小红书', '短信推送', 'APP 弹窗']
const anomalyTypes = [
  { code: 'duration', name: '答题时长异常' },
  { code: 'skip', name: '高跳题率' },
  { code: 'ip', name: 'IP 异常' },
  { code: 'device', name: '设备异常' },
  { code: 'duplicate', name: '重复提交' },
  { code: 'quality', name: '质检标记' },
]

export const mockAnomalyMatrix: AnomalyMatrixCell[] = channels.flatMap((channelName, ci) =>
  anomalyTypes.map((at, ai) => {
    const baseRate = (ci + ai) * 0.003
    const rate = baseRate + Math.random() * 0.02
    const count = Math.floor(2000 * rate * (1 + Math.random()))
    const level = rate > 0.05 ? 'critical' : rate > 0.03 ? 'high' : rate > 0.015 ? 'medium' : 'low'
    return {
      channelId: `c${ci + 1}`,
      channelName,
      anomalyType: at.code,
      anomalyTypeName: at.name,
      count,
      rate,
      level,
    }
  }),
)

const trendOptions: ('up' | 'down' | 'flat')[] = ['up', 'down', 'flat']
export const mockChannelRanking: ChannelRanking[] = channels.map((name, i) => ({
  rank: i + 1,
  channelId: `c${i + 1}`,
  channelName: name,
  totalSamples: 15000 + Math.floor(Math.random() * 20000),
  qualityScore: 95 - i * 4 - Math.floor(Math.random() * 3),
  anomalyRate: 0.05 + i * 0.012 + Math.random() * 0.01,
  avgDuration: 250 + Math.floor(Math.random() * 150),
  trend: trendOptions[Math.floor(Math.random() * 3)],
}))

const groupNames = ['基本信息题组', '产品使用题组', '满意度评价题组', '开放建议题组']
export const mockQuestionGroupDurations: QuestionGroupDuration[] = groupNames.map((name, i) => {
  const base = 40 + i * 30
  return {
    groupId: `g${i + 1}`,
    groupName: name,
    min: base * 0.3,
    q1: base * 0.7,
    median: base,
    q3: base * 1.4,
    max: base * 2.5,
    mean: base * 1.1,
    outliers: [
      base * 3.2 + Math.random() * 50,
      base * 3.8 + Math.random() * 30,
      base * 0.15,
    ],
  }
})

const regions = ['华东地区', '华南地区', '华北地区', '华中地区', '西南地区']
const devices = ['iOS', 'Android', 'PC 端', 'H5 移动端']
const qualityMarks: ('pass' | 'warning' | 'fail')[] = ['pass', 'warning', 'fail']
const anomalyCodes = ['duration', 'skip', 'ip', 'device', 'duplicate', 'quality']

export const mockAnomalySamples: AnomalySample[] = Array.from({ length: 50 }, (_, i) => {
  const sampleAnomalies = anomalyCodes.filter(() => Math.random() > 0.7)
  if (sampleAnomalies.length === 0) sampleAnomalies.push(anomalyCodes[Math.floor(Math.random() * anomalyCodes.length)])
  return {
    sampleId: `SAMPLE-${String(i + 10001).padStart(6, '0')}`,
    surveyId: 's1',
    surveyName: '用户满意度调研 Q2',
    channelId: `c${(i % 6) + 1}`,
    channelName: channels[i % 6],
    region: regions[i % 5],
    deviceType: devices[i % 4],
    duration: 45 + Math.floor(Math.random() * 600),
    skipCount: Math.floor(Math.random() * 8),
    totalQuestions: 25,
    anomalyTypes: sampleAnomalies,
    qualityMark: qualityMarks[Math.floor(Math.random() * 3)],
    submitTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    hasNote: Math.random() > 0.6,
  }
})

export function getMockAnswerTrajectory(sampleId: string): AnswerTrajectory[] {
  const questions = [
    { id: 'q1', title: '您的性别是？', groupId: 'g1' },
    { id: 'q2', title: '您的年龄段是？', groupId: 'g1' },
    { id: 'q3', title: '您所在的城市是？', groupId: 'g1' },
    { id: 'q4', title: '您使用我们产品的频率是？', groupId: 'g2' },
    { id: 'q5', title: '您主要使用哪些功能？', groupId: 'g2' },
    { id: 'q6', title: '您对产品整体满意度如何？', groupId: 'g3' },
    { id: 'q7', title: '您对客服服务的满意度？', groupId: 'g3' },
    { id: 'q8', title: '您对价格的接受度？', groupId: 'g3' },
    { id: 'q9', title: '您有什么改进建议？', groupId: 'g4' },
    { id: 'q10', title: '其他想说的话？', groupId: 'g4' },
  ]
  let time = 0
  return questions.map((q, i) => {
    const duration = 5 + Math.floor(Math.random() * 40)
    const isSkipped = Math.random() > 0.85 && i > 2
    const start = time
    time += duration
    return {
      questionId: q.id,
      questionTitle: q.title,
      groupId: q.groupId,
      startTime: start,
      endTime: time,
      duration,
      isSkipped,
      answerValue: isSkipped ? '' : `选项 ${Math.floor(Math.random() * 4) + 1}`,
    }
  })
}

export function getMockQualityCheckHits(sampleId: string): QualityCheckHit[] {
  const rules = [
    { ruleId: 'r1', ruleName: '答题时长过短', ruleDescription: '答题时长低于阈值，可能为机器人作答', threshold: '< 60 秒', severity: 'high' as const },
    { ruleId: 'r2', ruleName: '高跳题率', ruleDescription: '跳过题目数量超过比例阈值', threshold: '> 30%', severity: 'medium' as const },
    { ruleId: 'r3', ruleName: 'IP 集中度异常', ruleDescription: '同一 IP 短时间内提交过多', threshold: '> 50 次/小时', severity: 'high' as const },
  ]
  return rules.filter(() => Math.random() > 0.4).map(r => ({
    ...r,
    hitValue: String(Math.floor(Math.random() * 50) + 10),
  }))
}

export const mockNotes: ManualNote[] = [
  {
    noteId: 'n1',
    targetType: 'sample',
    targetId: 'SAMPLE-010005',
    content: '该样本答题时长异常短，且选项高度一致，判定为无效样本，已标记剔除。',
    tags: ['无效样本', '机器人'],
    author: '张三',
    createTime: '2024-06-15 14:30:00',
    updateTime: '2024-06-15 14:30:00',
  },
  {
    noteId: 'n2',
    targetType: 'channel',
    targetId: 'c3',
    content: '抖音渠道近期 IP 异常率上升，疑似有刷量行为，已通知渠道方核查。',
    tags: ['渠道异常', '刷量'],
    author: '李四',
    createTime: '2024-06-14 10:15:00',
    updateTime: '2024-06-14 11:00:00',
  },
]

const surveys = ['用户满意度调研 Q2', '产品使用反馈调研', '品牌认知度调研', '用户画像调研']
const questionGroups = ['基本信息题组', '产品使用题组', '满意度评价题组', '开放建议题组', '行为偏好题组']

export function getMockComparisonData(dimension: string): ComparisonData[] {
  const dimMap: Record<string, { id: string; name: string }[]> = {
    survey: surveys.map((name, i) => ({ id: `s${i + 1}`, name })),
    channel: channels.map((name, i) => ({ id: `c${i + 1}`, name })),
    questionGroup: questionGroups.map((name, i) => ({ id: `g${i + 1}`, name })),
    region: regions.map((name, i) => ({ id: `r${i + 1}`, name })),
    device: devices.map((name, i) => ({ id: `d${i + 1}`, name })),
  }
  const items = dimMap[dimension] || []
  return items.map(item => ({
    dimension,
    dimensionValue: item.name,
    metrics: {
      totalSamples: 5000 + Math.floor(Math.random() * 20000),
      validSamples: 4500 + Math.floor(Math.random() * 18000),
      anomalyRate: 0.05 + Math.random() * 0.1,
      avgDuration: 200 + Math.floor(Math.random() * 200),
      skipRate: 0.03 + Math.random() * 0.08,
      duplicateRate: 0.01 + Math.random() * 0.05,
      ipAbnormalRate: 0.02 + Math.random() * 0.06,
      deviceAbnormalRate: 0.01 + Math.random() * 0.04,
      qualityMarkRate: 0.03 + Math.random() * 0.07,
    },
  }))
}
