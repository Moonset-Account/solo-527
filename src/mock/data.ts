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
  { id: 's4', name: 'NPS 净推荐值调研', type: 'survey', code: 'NPS-2024' },
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
  { id: 'g1', name: '基本信息题组', type: 'questionGroup', code: 'GROUP-BASIC' },
  { id: 'g2', name: '产品使用题组', type: 'questionGroup', code: 'GROUP-USAGE' },
  { id: 'g3', name: '满意度评价题组', type: 'questionGroup', code: 'GROUP-SATISFY' },
  { id: 'g4', name: '开放建议题组', type: 'questionGroup', code: 'GROUP-OPEN' },
]

const surveys = ['用户满意度调研 Q2', '产品使用反馈调研', '品牌认知度调研', 'NPS 净推荐值调研']
const surveyIds = ['s1', 's2', 's3', 's4']
const channels = ['微信朋友圈', '微博推广', '抖音信息流', '小红书', '短信推送', 'APP 弹窗']
const channelIds = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6']
const regions = ['华东地区', '华南地区', '华北地区', '华中地区', '西南地区']
const devices = ['iOS', 'Android', 'PC 端', 'H5 移动端']
const questionGroups = ['基本信息题组', '产品使用题组', '满意度评价题组', '开放建议题组']
const qualityMarks: ('pass' | 'warning' | 'fail')[] = ['pass', 'warning', 'fail']
const anomalyNames: Record<string, string> = {
  duration: '时长异常',
  skip: '跳题异常',
  ip: 'IP异常',
  device: '设备异常',
  duplicate: '重复提交',
  quality: '质检不通过',
}

export const mockQualityMetrics: QualityMetrics = {
  totalSamples: 128563,
  validSamples: 115207,
  anomalyRate: 0.078,
  avgDuration: 342,
  skipRate: 0.052,
  duplicateRate: 0.023,
  ipAbnormalRate: 0.031,
  deviceAbnormalRate: 0.018,
  qualityMarkRate: 0.045,
}

export const mockFunnelData: FunnelData[] = [
  { stage: '提交样本', stageCode: 'submitted', count: 128563, conversionRate: 1.0, dropRate: 0 },
  { stage: '去重后样本', stageCode: 'deduped', count: 125612, conversionRate: 0.977, dropRate: 0.023 },
  { stage: '有效样本', stageCode: 'valid', count: 115207, conversionRate: 0.917, dropRate: 0.083 },
  { stage: '质检通过', stageCode: 'quality_pass', count: 109447, conversionRate: 0.95, dropRate: 0.05 },
  { stage: '最终入库', stageCode: 'final', count: 108672, conversionRate: 0.993, dropRate: 0.007 },
]

export const mockTrendData: TrendDataPoint[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const total = 4000 + Math.floor(i * 80) + (i % 7 === 0 ? 800 : 0)
  const anomalyCount = Math.floor(total * (0.06 + (i % 5) * 0.01))
  return {
    date,
    totalSamples: total,
    anomalyCount,
    anomalyRate: anomalyCount / total,
  }
})

export const mockChannelRanking: ChannelRanking[] = [
  { rank: 1, channelId: 'c6', channelName: 'APP 弹窗', totalSamples: 42156, qualityScore: 96, anomalyRate: 0.042, avgDuration: 368, trend: 'flat' },
  { rank: 2, channelId: 'c5', channelName: '短信推送', totalSamples: 28342, qualityScore: 94, anomalyRate: 0.058, avgDuration: 352, trend: 'up' },
  { rank: 3, channelId: 'c1', channelName: '微信朋友圈', totalSamples: 21567, qualityScore: 89, anomalyRate: 0.087, avgDuration: 325, trend: 'down' },
  { rank: 4, channelId: 'c2', channelName: '微博推广', totalSamples: 15823, qualityScore: 85, anomalyRate: 0.102, avgDuration: 312, trend: 'down' },
  { rank: 5, channelId: 'c4', channelName: '小红书', totalSamples: 12456, qualityScore: 82, anomalyRate: 0.118, avgDuration: 338, trend: 'up' },
  { rank: 6, channelId: 'c3', channelName: '抖音信息流', totalSamples: 8219, qualityScore: 76, anomalyRate: 0.156, avgDuration: 298, trend: 'up' },
]

export const mockQuestionGroupDurations: QuestionGroupDuration[] = [
  { groupId: 'g1', groupName: '基本信息题组', min: 12, q1: 25, median: 38, q3: 52, max: 95, mean: 40, outliers: [120, 145, 8] },
  { groupId: 'g2', groupName: '产品使用题组', min: 35, q1: 58, median: 85, q3: 120, max: 210, mean: 92, outliers: [280, 310, 22] },
  { groupId: 'g3', groupName: '满意度评价题组', min: 20, q1: 42, median: 65, q3: 95, max: 160, mean: 68, outliers: [220, 12] },
  { groupId: 'g4', groupName: '开放建议题组', min: 45, q1: 80, median: 125, q3: 180, max: 320, mean: 135, outliers: [450, 520, 25] },
]

const baseSamples = [
  { id: 1, survey: 0, channel: 0, region: 0, device: 0, duration: 42, anomalies: ['duration', 'quality'], quality: 'fail', skip: 12 },
  { id: 2, survey: 0, channel: 0, region: 0, device: 1, duration: 385, anomalies: [], quality: 'pass', skip: 1 },
  { id: 3, survey: 0, channel: 1, region: 1, device: 0, duration: 312, anomalies: ['skip'], quality: 'warning', skip: 8 },
  { id: 4, survey: 0, channel: 2, region: 2, device: 2, duration: 28, anomalies: ['duration', 'skip'], quality: 'fail', skip: 15 },
  { id: 5, survey: 1, channel: 2, region: 0, device: 1, duration: 295, anomalies: ['duplicate'], quality: 'warning', skip: 0 },
  { id: 6, survey: 1, channel: 3, region: 3, device: 0, duration: 520, anomalies: [], quality: 'pass', skip: 2 },
  { id: 7, survey: 1, channel: 3, region: 1, device: 3, duration: 45, anomalies: ['duration', 'quality'], quality: 'fail', skip: 10 },
  { id: 8, survey: 1, channel: 4, region: 4, device: 1, duration: 368, anomalies: [], quality: 'pass', skip: 0 },
  { id: 9, survey: 2, channel: 4, region: 2, device: 2, duration: 256, anomalies: ['ip'], quality: 'warning', skip: 3 },
  { id: 10, survey: 2, channel: 5, region: 0, device: 0, duration: 412, anomalies: [], quality: 'pass', skip: 0 },
  { id: 11, survey: 2, channel: 5, region: 3, device: 1, duration: 18, anomalies: ['duration', 'skip', 'quality'], quality: 'fail', skip: 18 },
  { id: 12, survey: 2, channel: 0, region: 1, device: 3, duration: 338, anomalies: [], quality: 'pass', skip: 1 },
  { id: 13, survey: 3, channel: 1, region: 4, device: 0, duration: 288, anomalies: ['device'], quality: 'warning', skip: 2 },
  { id: 14, survey: 3, channel: 2, region: 2, device: 1, duration: 375, anomalies: [], quality: 'pass', skip: 0 },
  { id: 15, survey: 3, channel: 3, region: 0, device: 2, duration: 52, anomalies: ['duration', 'quality'], quality: 'fail', skip: 9 },
  { id: 16, survey: 0, channel: 4, region: 3, device: 0, duration: 298, anomalies: [], quality: 'pass', skip: 0 },
  { id: 17, survey: 1, channel: 5, region: 4, device: 1, duration: 445, anomalies: [], quality: 'pass', skip: 1 },
  { id: 18, survey: 2, channel: 1, region: 0, device: 3, duration: 35, anomalies: ['duration'], quality: 'warning', skip: 7 },
  { id: 19, survey: 3, channel: 0, region: 1, device: 0, duration: 362, anomalies: [], quality: 'pass', skip: 0 },
  { id: 20, survey: 0, channel: 3, region: 2, device: 1, duration: 68, anomalies: ['duration', 'ip'], quality: 'warning', skip: 5 },
  { id: 21, survey: 1, channel: 4, region: 3, device: 2, duration: 402, anomalies: [], quality: 'pass', skip: 0 },
  { id: 22, survey: 2, channel: 2, region: 4, device: 0, duration: 25, anomalies: ['duration', 'quality'], quality: 'fail', skip: 12 },
  { id: 23, survey: 3, channel: 1, region: 0, device: 1, duration: 315, anomalies: [], quality: 'pass', skip: 0 },
  { id: 24, survey: 0, channel: 5, region: 1, device: 3, duration: 278, anomalies: ['skip'], quality: 'warning', skip: 6 },
  { id: 25, survey: 1, channel: 2, region: 2, device: 0, duration: 392, anomalies: [], quality: 'pass', skip: 1 },
  { id: 26, survey: 2, channel: 3, region: 3, device: 1, duration: 48, anomalies: ['duration', 'duplicate'], quality: 'warning', skip: 8 },
  { id: 27, survey: 3, channel: 4, region: 4, device: 2, duration: 356, anomalies: [], quality: 'pass', skip: 0 },
  { id: 28, survey: 0, channel: 1, region: 0, device: 0, duration: 322, anomalies: [], quality: 'pass', skip: 0 },
  { id: 29, survey: 1, channel: 0, region: 1, device: 1, duration: 38, anomalies: ['duration', 'quality'], quality: 'fail', skip: 11 },
  { id: 30, survey: 2, channel: 4, region: 2, device: 3, duration: 268, anomalies: [], quality: 'pass', skip: 2 },
  { id: 31, survey: 3, channel: 5, region: 3, device: 0, duration: 415, anomalies: [], quality: 'pass', skip: 0 },
  { id: 32, survey: 0, channel: 2, region: 4, device: 1, duration: 72, anomalies: ['duration', 'ip'], quality: 'warning', skip: 4 },
  { id: 33, survey: 1, channel: 3, region: 0, device: 2, duration: 308, anomalies: [], quality: 'pass', skip: 0 },
  { id: 34, survey: 2, channel: 1, region: 1, device: 0, duration: 22, anomalies: ['duration', 'skip', 'quality'], quality: 'fail', skip: 16 },
  { id: 35, survey: 3, channel: 2, region: 2, device: 1, duration: 388, anomalies: [], quality: 'pass', skip: 0 },
  { id: 36, survey: 0, channel: 4, region: 3, device: 3, duration: 295, anomalies: ['device'], quality: 'warning', skip: 1 },
  { id: 37, survey: 1, channel: 5, region: 4, device: 0, duration: 432, anomalies: [], quality: 'pass', skip: 0 },
  { id: 38, survey: 2, channel: 0, region: 0, device: 1, duration: 58, anomalies: ['duration'], quality: 'warning', skip: 6 },
  { id: 39, survey: 3, channel: 3, region: 1, device: 2, duration: 345, anomalies: [], quality: 'pass', skip: 0 },
  { id: 40, survey: 0, channel: 3, region: 2, device: 0, duration: 312, anomalies: [], quality: 'pass', skip: 0 },
  { id: 41, survey: 1, channel: 1, region: 3, device: 1, duration: 30, anomalies: ['duration', 'quality'], quality: 'fail', skip: 13 },
  { id: 42, survey: 2, channel: 5, region: 4, device: 3, duration: 372, anomalies: [], quality: 'pass', skip: 1 },
  { id: 43, survey: 3, channel: 4, region: 0, device: 0, duration: 285, anomalies: ['skip'], quality: 'warning', skip: 7 },
  { id: 44, survey: 0, channel: 2, region: 1, device: 1, duration: 458, anomalies: [], quality: 'pass', skip: 0 },
  { id: 45, survey: 1, channel: 4, region: 2, device: 2, duration: 42, anomalies: ['duration', 'duplicate'], quality: 'fail', skip: 9 },
  { id: 46, survey: 2, channel: 3, region: 3, device: 0, duration: 328, anomalies: [], quality: 'pass', skip: 0 },
  { id: 47, survey: 3, channel: 1, region: 4, device: 1, duration: 365, anomalies: [], quality: 'pass', skip: 0 },
  { id: 48, survey: 0, channel: 5, region: 0, device: 2, duration: 85, anomalies: ['duration', 'ip'], quality: 'warning', skip: 3 },
  { id: 49, survey: 1, channel: 0, region: 1, device: 3, duration: 398, anomalies: [], quality: 'pass', skip: 0 },
  { id: 50, survey: 2, channel: 2, region: 2, device: 0, duration: 18, anomalies: ['duration', 'quality'], quality: 'fail', skip: 14 },
  { id: 51, survey: 3, channel: 0, region: 3, device: 1, duration: 342, anomalies: [], quality: 'pass', skip: 0 },
  { id: 52, survey: 0, channel: 1, region: 4, device: 0, duration: 275, anomalies: [], quality: 'pass', skip: 1 },
  { id: 53, survey: 1, channel: 2, region: 0, device: 1, duration: 55, anomalies: ['duration'], quality: 'warning', skip: 5 },
  { id: 54, survey: 2, channel: 4, region: 1, device: 2, duration: 318, anomalies: [], quality: 'pass', skip: 0 },
  { id: 55, survey: 3, channel: 5, region: 2, device: 3, duration: 405, anomalies: [], quality: 'pass', skip: 0 },
  { id: 56, survey: 0, channel: 3, region: 3, device: 0, duration: 36, anomalies: ['duration', 'quality'], quality: 'fail', skip: 10 },
  { id: 57, survey: 1, channel: 3, region: 4, device: 1, duration: 382, anomalies: [], quality: 'pass', skip: 0 },
  { id: 58, survey: 2, channel: 1, region: 0, device: 2, duration: 298, anomalies: ['duplicate'], quality: 'warning', skip: 0 },
  { id: 59, survey: 3, channel: 2, region: 1, device: 0, duration: 335, anomalies: [], quality: 'pass', skip: 1 },
  { id: 60, survey: 0, channel: 4, region: 2, device: 1, duration: 78, anomalies: ['duration', 'skip'], quality: 'warning', skip: 7 },
]

export const mockAnomalySamples: AnomalySample[] = baseSamples.map(s => ({
  sampleId: `SAMPLE-${String(20240601000 + s.id).padStart(12, '0')}`,
  surveyId: surveyIds[s.survey],
  surveyName: surveys[s.survey],
  channelId: channelIds[s.channel],
  channelName: channels[s.channel],
  region: regions[s.region],
  deviceType: devices[s.device],
  duration: s.duration,
  skipCount: s.skip,
  totalQuestions: 25,
  anomalyTypes: s.anomalies,
  qualityMark: s.quality,
  submitTime: new Date(Date.now() - (s.id * 3600 * 1000)).toISOString(),
  hasNote: [1, 4, 7, 11, 15, 22, 29, 34, 45, 50, 56].includes(s.id),
}))

export const mockAnomalyMatrix: AnomalyMatrixCell[] = [
  { channelId: 'c1', channelName: '微信朋友圈', anomalyType: 'duration', anomalyTypeName: '时长异常', count: 892, rate: 0.041, level: 'medium' },
  { channelId: 'c1', channelName: '微信朋友圈', anomalyType: 'skip', anomalyTypeName: '跳题异常', count: 567, rate: 0.026, level: 'medium' },
  { channelId: 'c1', channelName: '微信朋友圈', anomalyType: 'ip', anomalyTypeName: 'IP异常', count: 345, rate: 0.016, level: 'low' },
  { channelId: 'c1', channelName: '微信朋友圈', anomalyType: 'device', anomalyTypeName: '设备异常', count: 234, rate: 0.011, level: 'low' },
  { channelId: 'c1', channelName: '微信朋友圈', anomalyType: 'duplicate', anomalyTypeName: '重复提交', count: 456, rate: 0.021, level: 'medium' },
  { channelId: 'c1', channelName: '微信朋友圈', anomalyType: 'quality', anomalyTypeName: '质检不通过', count: 678, rate: 0.031, level: 'high' },

  { channelId: 'c2', channelName: '微博推广', anomalyType: 'duration', anomalyTypeName: '时长异常', count: 723, rate: 0.046, level: 'medium' },
  { channelId: 'c2', channelName: '微博推广', anomalyType: 'skip', anomalyTypeName: '跳题异常', count: 489, rate: 0.031, level: 'medium' },
  { channelId: 'c2', channelName: '微博推广', anomalyType: 'ip', anomalyTypeName: 'IP异常', count: 267, rate: 0.017, level: 'low' },
  { channelId: 'c2', channelName: '微博推广', anomalyType: 'device', anomalyTypeName: '设备异常', count: 189, rate: 0.012, level: 'low' },
  { channelId: 'c2', channelName: '微博推广', anomalyType: 'duplicate', anomalyTypeName: '重复提交', count: 378, rate: 0.024, level: 'medium' },
  { channelId: 'c2', channelName: '微博推广', anomalyType: 'quality', anomalyTypeName: '质检不通过', count: 567, rate: 0.036, level: 'high' },

  { channelId: 'c3', channelName: '抖音信息流', anomalyType: 'duration', anomalyTypeName: '时长异常', count: 534, rate: 0.065, level: 'high' },
  { channelId: 'c3', channelName: '抖音信息流', anomalyType: 'skip', anomalyTypeName: '跳题异常', count: 389, rate: 0.047, level: 'high' },
  { channelId: 'c3', channelName: '抖音信息流', anomalyType: 'ip', anomalyTypeName: 'IP异常', count: 234, rate: 0.028, level: 'medium' },
  { channelId: 'c3', channelName: '抖音信息流', anomalyType: 'device', anomalyTypeName: '设备异常', count: 156, rate: 0.019, level: 'low' },
  { channelId: 'c3', channelName: '抖音信息流', anomalyType: 'duplicate', anomalyTypeName: '重复提交', count: 278, rate: 0.034, level: 'medium' },
  { channelId: 'c3', channelName: '抖音信息流', anomalyType: 'quality', anomalyTypeName: '质检不通过', count: 456, rate: 0.055, level: 'critical' },

  { channelId: 'c4', channelName: '小红书', anomalyType: 'duration', anomalyTypeName: '时长异常', count: 445, rate: 0.036, level: 'medium' },
  { channelId: 'c4', channelName: '小红书', anomalyType: 'skip', anomalyTypeName: '跳题异常', count: 378, rate: 0.030, level: 'medium' },
  { channelId: 'c4', channelName: '小红书', anomalyType: 'ip', anomalyTypeName: 'IP异常', count: 189, rate: 0.015, level: 'low' },
  { channelId: 'c4', channelName: '小红书', anomalyType: 'device', anomalyTypeName: '设备异常', count: 134, rate: 0.011, level: 'low' },
  { channelId: 'c4', channelName: '小红书', anomalyType: 'duplicate', anomalyTypeName: '重复提交', count: 223, rate: 0.018, level: 'low' },
  { channelId: 'c4', channelName: '小红书', anomalyType: 'quality', anomalyTypeName: '质检不通过', count: 345, rate: 0.028, level: 'medium' },

  { channelId: 'c5', channelName: '短信推送', anomalyType: 'duration', anomalyTypeName: '时长异常', count: 534, rate: 0.019, level: 'low' },
  { channelId: 'c5', channelName: '短信推送', anomalyType: 'skip', anomalyTypeName: '跳题异常', count: 423, rate: 0.015, level: 'low' },
  { channelId: 'c5', channelName: '短信推送', anomalyType: 'ip', anomalyTypeName: 'IP异常', count: 267, rate: 0.009, level: 'low' },
  { channelId: 'c5', channelName: '短信推送', anomalyType: 'device', anomalyTypeName: '设备异常', count: 178, rate: 0.006, level: 'low' },
  { channelId: 'c5', channelName: '短信推送', anomalyType: 'duplicate', anomalyTypeName: '重复提交', count: 312, rate: 0.011, level: 'low' },
  { channelId: 'c5', channelName: '短信推送', anomalyType: 'quality', anomalyTypeName: '质检不通过', count: 389, rate: 0.014, level: 'low' },

  { channelId: 'c6', channelName: 'APP 弹窗', anomalyType: 'duration', anomalyTypeName: '时长异常', count: 623, rate: 0.015, level: 'low' },
  { channelId: 'c6', channelName: 'APP 弹窗', anomalyType: 'skip', anomalyTypeName: '跳题异常', count: 456, rate: 0.011, level: 'low' },
  { channelId: 'c6', channelName: 'APP 弹窗', anomalyType: 'ip', anomalyTypeName: 'IP异常', count: 289, rate: 0.007, level: 'low' },
  { channelId: 'c6', channelName: 'APP 弹窗', anomalyType: 'device', anomalyTypeName: '设备异常', count: 198, rate: 0.005, level: 'low' },
  { channelId: 'c6', channelName: 'APP 弹窗', anomalyType: 'duplicate', anomalyTypeName: '重复提交', count: 356, rate: 0.008, level: 'low' },
  { channelId: 'c6', channelName: 'APP 弹窗', anomalyType: 'quality', anomalyTypeName: '质检不通过', count: 423, rate: 0.010, level: 'low' },
]

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
  const isFastSample = sampleId.endsWith('001') || sampleId.endsWith('004') || sampleId.endsWith('007')
  return questions.map((q, i) => {
    const baseDuration = isFastSample ? 2 + Math.floor(Math.random() * 5) : 8 + Math.floor(Math.random() * 35)
    const isSkipped = isFastSample && i > 5
    const start = time
    time += baseDuration
    return {
      questionId: q.id,
      questionTitle: q.title,
      groupId: q.groupId,
      startTime: start,
      endTime: time,
      duration: baseDuration,
      isSkipped,
      answerValue: isSkipped ? '' : ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
    }
  })
}

export function getMockQualityCheckHits(sampleId: string): QualityCheckHit[] {
  const allRules = [
    { ruleId: 'r1', ruleName: '答题时长过短', ruleDescription: '答题时长低于阈值，可能为机器人作答', threshold: '< 60 秒', severity: 'high' as const },
    { ruleId: 'r2', ruleName: '高跳题率', ruleDescription: '跳过题目数量超过比例阈值', threshold: '> 30%', severity: 'medium' as const },
    { ruleId: 'r3', ruleName: 'IP 集中度异常', ruleDescription: '同一 IP 短时间内提交过多', threshold: '> 50 次/小时', severity: 'high' as const },
    { ruleId: 'r4', ruleName: '直线答题检测', ruleDescription: '矩阵题答案向量相似度极高', threshold: '> 0.9', severity: 'medium' as const },
    { ruleId: 'r5', ruleName: '测谎题不通过', ruleDescription: '逻辑验证题回答不一致', threshold: '不一致', severity: 'high' as const },
  ]
  const sampleIndex = parseInt(sampleId.slice(-3))
  return allRules.filter((_, i) => (sampleIndex + i) % 3 === 0).map(r => ({
    ...r,
    hitValue: ['32秒', '45%', '78次/小时', '0.94', '不一致'][allRules.indexOf(r)],
  }))
}

export const mockNotes: ManualNote[] = [
  {
    noteId: 'n1',
    targetType: 'sample',
    targetId: 'SAMPLE-20240601000001',
    content: '该样本答题时长异常短（42秒），且选项高度一致，判定为无效样本，已标记剔除。',
    tags: ['无效样本', '机器人'],
    author: '张三',
    createTime: '2024-06-15 14:30:00',
    updateTime: '2024-06-15 14:30:00',
  },
  {
    noteId: 'n2',
    targetType: 'sample',
    targetId: 'SAMPLE-20240601000004',
    content: '答题时长28秒，跳题15道，确认无效，已进入黑名单。',
    tags: ['无效样本', '高跳题率'],
    author: '李四',
    createTime: '2024-06-15 15:12:00',
    updateTime: '2024-06-15 15:12:00',
  },
  {
    noteId: 'n3',
    targetType: 'channel',
    targetId: 'c3',
    content: '抖音渠道近一周质量持续下降，建议减少投放量或优化定向人群。',
    tags: ['渠道质量', '优化建议'],
    author: '王五',
    createTime: '2024-06-14 10:00:00',
    updateTime: '2024-06-14 10:00:00',
  },
  {
    noteId: 'n4',
    targetType: 'sample',
    targetId: 'SAMPLE-20240601000011',
    content: '测谎题未通过，逻辑矛盾，已标记。',
    tags: ['质检不通过', '逻辑矛盾'],
    author: '张三',
    createTime: '2024-06-13 16:45:00',
    updateTime: '2024-06-13 16:45:00',
  },
]

export function getMockComparisonData(dimension: string): ComparisonData[] {
  const dimMap: Record<string, { id: string; name: string; metrics: Partial<QualityMetrics> }[]> = {
    survey: [
      { id: 's1', name: '用户满意度调研 Q2', metrics: { totalSamples: 42567, validSamples: 38987, anomalyRate: 0.068, avgDuration: 356, skipRate: 0.048, duplicateRate: 0.021, ipAbnormalRate: 0.028, deviceAbnormalRate: 0.016, qualityMarkRate: 0.042 } },
      { id: 's2', name: '产品使用反馈调研', metrics: { totalSamples: 35234, validSamples: 32156, anomalyRate: 0.082, avgDuration: 328, skipRate: 0.056, duplicateRate: 0.025, ipAbnormalRate: 0.033, deviceAbnormalRate: 0.019, qualityMarkRate: 0.048 } },
      { id: 's3', name: '品牌认知度调研', metrics: { totalSamples: 28756, validSamples: 25432, anomalyRate: 0.091, avgDuration: 298, skipRate: 0.062, duplicateRate: 0.028, ipAbnormalRate: 0.036, deviceAbnormalRate: 0.021, qualityMarkRate: 0.052 } },
      { id: 's4', name: 'NPS 净推荐值调研', metrics: { totalSamples: 22006, validSamples: 18632, anomalyRate: 0.075, avgDuration: 385, skipRate: 0.042, duplicateRate: 0.018, ipAbnormalRate: 0.024, deviceAbnormalRate: 0.014, qualityMarkRate: 0.038 } },
    ],
    channel: [
      { id: 'c1', name: '微信朋友圈', metrics: { totalSamples: 21567, validSamples: 19678, anomalyRate: 0.087, avgDuration: 325, skipRate: 0.058, duplicateRate: 0.026, ipAbnormalRate: 0.035, deviceAbnormalRate: 0.020, qualityMarkRate: 0.051 } },
      { id: 'c2', name: '微博推广', metrics: { totalSamples: 15823, validSamples: 14215, anomalyRate: 0.102, avgDuration: 312, skipRate: 0.065, duplicateRate: 0.029, ipAbnormalRate: 0.038, deviceAbnormalRate: 0.022, qualityMarkRate: 0.056 } },
      { id: 'c3', name: '抖音信息流', metrics: { totalSamples: 8219, validSamples: 7123, anomalyRate: 0.156, avgDuration: 298, skipRate: 0.089, duplicateRate: 0.041, ipAbnormalRate: 0.052, deviceAbnormalRate: 0.031, qualityMarkRate: 0.078 } },
      { id: 'c4', name: '小红书', metrics: { totalSamples: 12456, validSamples: 11234, anomalyRate: 0.118, avgDuration: 338, skipRate: 0.072, duplicateRate: 0.033, ipAbnormalRate: 0.041, deviceAbnormalRate: 0.025, qualityMarkRate: 0.062 } },
      { id: 'c5', name: '短信推送', metrics: { totalSamples: 28342, validSamples: 26125, anomalyRate: 0.058, avgDuration: 352, skipRate: 0.039, duplicateRate: 0.016, ipAbnormalRate: 0.021, deviceAbnormalRate: 0.013, qualityMarkRate: 0.032 } },
      { id: 'c6', name: 'APP 弹窗', metrics: { totalSamples: 42156, validSamples: 39876, anomalyRate: 0.042, avgDuration: 368, skipRate: 0.032, duplicateRate: 0.012, ipAbnormalRate: 0.015, deviceAbnormalRate: 0.009, qualityMarkRate: 0.025 } },
    ],
    questionGroup: [
      { id: 'g1', name: '基本信息题组', metrics: { totalSamples: 128563, validSamples: 125000, anomalyRate: 0.028, avgDuration: 38, skipRate: 0.015, duplicateRate: 0, ipAbnormalRate: 0, deviceAbnormalRate: 0, qualityMarkRate: 0.012 } },
      { id: 'g2', name: '产品使用题组', metrics: { totalSamples: 125000, validSamples: 120000, anomalyRate: 0.042, avgDuration: 85, skipRate: 0.038, duplicateRate: 0, ipAbnormalRate: 0, deviceAbnormalRate: 0, qualityMarkRate: 0.028 } },
      { id: 'g3', name: '满意度评价题组', metrics: { totalSamples: 120000, validSamples: 117500, anomalyRate: 0.035, avgDuration: 65, skipRate: 0.028, duplicateRate: 0, ipAbnormalRate: 0, deviceAbnormalRate: 0, qualityMarkRate: 0.035 } },
      { id: 'g4', name: '开放建议题组', metrics: { totalSamples: 115000, validSamples: 110000, anomalyRate: 0.056, avgDuration: 125, skipRate: 0.085, duplicateRate: 0, ipAbnormalRate: 0, deviceAbnormalRate: 0, qualityMarkRate: 0.048 } },
    ],
    region: [
      { id: 'r1', name: '华东地区', metrics: { totalSamples: 38567, validSamples: 35234, anomalyRate: 0.072, avgDuration: 352, skipRate: 0.048, duplicateRate: 0.022, ipAbnormalRate: 0.025, deviceAbnormalRate: 0.016, qualityMarkRate: 0.041 } },
      { id: 'r2', name: '华南地区', metrics: { totalSamples: 32145, validSamples: 29087, anomalyRate: 0.085, avgDuration: 338, skipRate: 0.055, duplicateRate: 0.026, ipAbnormalRate: 0.032, deviceAbnormalRate: 0.019, qualityMarkRate: 0.048 } },
      { id: 'r3', name: '华北地区', metrics: { totalSamples: 25678, validSamples: 23123, anomalyRate: 0.078, avgDuration: 345, skipRate: 0.051, duplicateRate: 0.024, ipAbnormalRate: 0.028, deviceAbnormalRate: 0.017, qualityMarkRate: 0.045 } },
      { id: 'r4', name: '华中地区', metrics: { totalSamples: 18234, validSamples: 16234, anomalyRate: 0.081, avgDuration: 328, skipRate: 0.058, duplicateRate: 0.025, ipAbnormalRate: 0.030, deviceAbnormalRate: 0.018, qualityMarkRate: 0.046 } },
      { id: 'r5', name: '西南地区', metrics: { totalSamples: 13939, validSamples: 11529, anomalyRate: 0.092, avgDuration: 315, skipRate: 0.062, duplicateRate: 0.028, ipAbnormalRate: 0.035, deviceAbnormalRate: 0.020, qualityMarkRate: 0.052 } },
    ],
    device: [
      { id: 'd1', name: 'iOS', metrics: { totalSamples: 48567, validSamples: 44234, anomalyRate: 0.065, avgDuration: 365, skipRate: 0.042, duplicateRate: 0.018, ipAbnormalRate: 0.022, deviceAbnormalRate: 0.012, qualityMarkRate: 0.036 } },
      { id: 'd2', name: 'Android', metrics: { totalSamples: 52345, validSamples: 47567, anomalyRate: 0.082, avgDuration: 328, skipRate: 0.056, duplicateRate: 0.025, ipAbnormalRate: 0.032, deviceAbnormalRate: 0.020, qualityMarkRate: 0.048 } },
      { id: 'd3', name: 'PC 端', metrics: { totalSamples: 18234, validSamples: 16543, anomalyRate: 0.076, avgDuration: 385, skipRate: 0.052, duplicateRate: 0.022, ipAbnormalRate: 0.030, deviceAbnormalRate: 0.018, qualityMarkRate: 0.045 } },
      { id: 'd4', name: 'H5 移动端', metrics: { totalSamples: 9417, validSamples: 6863, anomalyRate: 0.105, avgDuration: 285, skipRate: 0.068, duplicateRate: 0.035, ipAbnormalRate: 0.045, deviceAbnormalRate: 0.028, qualityMarkRate: 0.062 } },
    ],
  }
  const items = dimMap[dimension] || []
  return items.map(item => ({
    dimension,
    dimensionValue: item.name,
    metrics: item.metrics,
  }))
}
