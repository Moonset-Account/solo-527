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
import dayjs from 'dayjs'

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

interface RawSampleRecord {
  id: number
  surveyIdx: number
  channelIdx: number
  regionIdx: number
  deviceIdx: number
  duration: number
  skipCount: number
  anomalyTypes: string[]
  qualityMark: 'pass' | 'warning' | 'fail'
  offsetHours: number
  hasNote: boolean
  groupDurations: Record<string, number>
}

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function buildRawSamples(): RawSampleRecord[] {
  const rand = seededRandom(20240607)
  const samples: RawSampleRecord[] = []
  let id = 1

  const channelQualityBias: Record<number, number> = {
    0: 0.12,
    1: 0.15,
    2: 0.22,
    3: 0.18,
    4: 0.07,
    5: 0.05,
  }
  const channelVolumeBias: Record<number, number> = {
    0: 1.0,
    1: 0.75,
    2: 0.4,
    3: 0.6,
    4: 1.3,
    5: 2.0,
  }

  for (let day = 0; day < 90; day++) {
    const dayMultiplier = 0.7 + (day / 90) * 0.6
    const weekdayBias = (day % 7 === 0 || day % 7 === 6) ? 0.6 : 1.0

    for (let s = 0; s < 4; s++) {
      for (let c = 0; c < 6; c++) {
        const baseCount = Math.floor(12 * channelVolumeBias[c] * dayMultiplier * weekdayBias)

        for (let i = 0; i < baseCount; i++) {
          const r = rand()
          const regionIdx = Math.floor(rand() * 5)
          const deviceIdx = Math.floor(rand() * 4)
          const isAnomaly = r < channelQualityBias[c]
          const offsetHours = day * 24 + Math.floor(rand() * 24)

          let duration: number
          let skipCount: number
          let anomalyTypes: string[] = []
          let qualityMark: 'pass' | 'warning' | 'fail'

          if (isAnomaly) {
            const anomalyKind = Math.floor(rand() * 4)
            if (anomalyKind === 0) {
              duration = 15 + Math.floor(rand() * 45)
              anomalyTypes = ['duration']
              skipCount = 2 + Math.floor(rand() * 6)
              qualityMark = rand() < 0.6 ? 'fail' : 'warning'
              if (rand() < 0.4) anomalyTypes.push('quality')
              if (rand() < 0.3) anomalyTypes.push('skip')
            } else if (anomalyKind === 1) {
              duration = 200 + Math.floor(rand() * 150)
              skipCount = 8 + Math.floor(rand() * 12)
              anomalyTypes = ['skip']
              qualityMark = 'warning'
              if (rand() < 0.3) anomalyTypes.push('quality')
            } else if (anomalyKind === 2) {
              duration = 180 + Math.floor(rand() * 200)
              skipCount = 1 + Math.floor(rand() * 4)
              anomalyTypes = rand() < 0.5 ? ['ip'] : ['duplicate']
              qualityMark = 'warning'
            } else {
              duration = 250 + Math.floor(rand() * 180)
              skipCount = 2 + Math.floor(rand() * 5)
              anomalyTypes = ['device']
              qualityMark = 'warning'
            }
          } else {
            duration = 280 + Math.floor(rand() * 180)
            skipCount = Math.floor(rand() * 3)
            anomalyTypes = []
            qualityMark = 'pass'
          }

          const groupDurations = {
            g1: Math.max(15, Math.floor(duration * 0.12 + rand() * 15)),
            g2: Math.max(25, Math.floor(duration * 0.28 + rand() * 30)),
            g3: Math.max(20, Math.floor(duration * 0.22 + rand() * 25)),
            g4: Math.max(30, Math.floor(duration * 0.38 + rand() * 40)),
          }

          samples.push({
            id: id++,
            surveyIdx: s,
            channelIdx: c,
            regionIdx,
            deviceIdx,
            duration,
            skipCount,
            anomalyTypes,
            qualityMark,
            offsetHours,
            hasNote: isAnomaly && rand() < 0.15,
            groupDurations,
          })
        }
      }
    }
  }

  return samples
}

const rawSamples = buildRawSamples()

function toAnomalySample(raw: RawSampleRecord): AnomalySample {
  return {
    sampleId: `SAMPLE-${String(2024060700000 + raw.id).padStart(12, '0')}`,
    surveyId: surveyIds[raw.surveyIdx],
    surveyName: surveys[raw.surveyIdx],
    channelId: channelIds[raw.channelIdx],
    channelName: channels[raw.channelIdx],
    region: regions[raw.regionIdx],
    deviceType: devices[raw.deviceIdx],
    duration: raw.duration,
    skipCount: raw.skipCount,
    totalQuestions: 25,
    anomalyTypes: raw.anomalyTypes,
    qualityMark: raw.qualityMark,
    submitTime: dayjs().subtract(raw.offsetHours, 'hour').toISOString(),
    hasNote: raw.hasNote,
  }
}

export function getRawSamplesByTimeWindow(windowDays: number): RawSampleRecord[] {
  const maxHours = windowDays * 24
  return rawSamples.filter(s => s.offsetHours <= maxHours)
}

export function buildAnomalySamples(windowDays: number): AnomalySample[] {
  return getRawSamplesByTimeWindow(windowDays)
    .filter(s => s.anomalyTypes.length > 0 || s.qualityMark !== 'pass')
    .map(toAnomalySample)
}

export function buildQualityMetrics(windowDays: number): QualityMetrics {
  const data = getRawSamplesByTimeWindow(windowDays)
  const total = data.length
  const valid = data.filter(s => s.qualityMark !== 'fail').length
  const anomaly = data.filter(s => s.anomalyTypes.length > 0).length
  const totalDuration = data.reduce((sum, s) => sum + s.duration, 0)
  const skipTotal = data.filter(s => s.skipCount > 5).length
  const dupTotal = data.filter(s => s.anomalyTypes.includes('duplicate')).length
  const ipTotal = data.filter(s => s.anomalyTypes.includes('ip')).length
  const deviceTotal = data.filter(s => s.anomalyTypes.includes('device')).length
  const markTotal = data.filter(s => s.qualityMark !== 'pass').length

  return {
    totalSamples: total,
    validSamples: valid,
    anomalyRate: total > 0 ? anomaly / total : 0,
    avgDuration: total > 0 ? Math.floor(totalDuration / total) : 0,
    skipRate: total > 0 ? skipTotal / total : 0,
    duplicateRate: total > 0 ? dupTotal / total : 0,
    ipAbnormalRate: total > 0 ? ipTotal / total : 0,
    deviceAbnormalRate: total > 0 ? deviceTotal / total : 0,
    qualityMarkRate: total > 0 ? markTotal / total : 0,
  }
}

export function buildFunnelData(windowDays: number): FunnelData[] {
  const data = getRawSamplesByTimeWindow(windowDays)
  const total = data.length
  const deduped = total - Math.floor(total * 0.023)
  const valid = data.filter(s => s.qualityMark !== 'fail').length
  const qPass = data.filter(s => s.qualityMark === 'pass').length
  const final = Math.floor(qPass * 0.993)

  return [
    { stage: '提交样本', stageCode: 'submitted', count: total, conversionRate: 1.0, dropRate: 0 },
    { stage: '去重后样本', stageCode: 'deduped', count: deduped, conversionRate: total > 0 ? deduped / total : 0, dropRate: total > 0 ? (total - deduped) / total : 0 },
    { stage: '有效样本', stageCode: 'valid', count: valid, conversionRate: total > 0 ? valid / total : 0, dropRate: total > 0 ? (total - valid) / total : 0 },
    { stage: '质检通过', stageCode: 'quality_pass', count: qPass, conversionRate: valid > 0 ? qPass / valid : 0, dropRate: valid > 0 ? (valid - qPass) / valid : 0 },
    { stage: '最终入库', stageCode: 'final', count: final, conversionRate: qPass > 0 ? final / qPass : 0, dropRate: qPass > 0 ? (qPass - final) / qPass : 0 },
  ]
}

export function buildTrendData(windowDays: number): TrendDataPoint[] {
  const data = getRawSamplesByTimeWindow(windowDays)
  const byDay: Record<string, RawSampleRecord[]> = {}

  for (const s of data) {
    const date = dayjs().subtract(s.offsetHours, 'hour').format('YYYY-MM-DD')
    if (!byDay[date]) byDay[date] = []
    byDay[date].push(s)
  }

  return Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, list]) => {
      const total = list.length
      const anomaly = list.filter(s => s.anomalyTypes.length > 0).length
      return {
        date,
        totalSamples: total,
        anomalyCount: anomaly,
        anomalyRate: total > 0 ? anomaly / total : 0,
      }
    })
}

export function buildChannelRanking(windowDays: number): ChannelRanking[] {
  const data = getRawSamplesByTimeWindow(windowDays)
  const byChannel: Record<number, RawSampleRecord[]> = {}

  for (const s of data) {
    if (!byChannel[s.channelIdx]) byChannel[s.channelIdx] = []
    byChannel[s.channelIdx].push(s)
  }

  const qualityScores: Record<number, number> = {
    5: 96,
    4: 94,
    0: 89,
    1: 85,
    3: 82,
    2: 76,
  }
  const trends: Record<number, 'up' | 'down' | 'flat'> = {
    5: 'flat',
    4: 'up',
    0: 'down',
    1: 'down',
    3: 'up',
    2: 'up',
  }

  const ranking = Object.entries(byChannel).map(([idx, list]) => {
    const c = parseInt(idx)
    const total = list.length
    const anomaly = list.filter(s => s.anomalyTypes.length > 0).length
    const avgDur = list.reduce((sum, s) => sum + s.duration, 0) / total
    return {
      channelIdx: c,
      channelId: channelIds[c],
      channelName: channels[c],
      totalSamples: total,
      anomalyRate: total > 0 ? anomaly / total : 0,
      avgDuration: Math.floor(avgDur),
      qualityScore: qualityScores[c],
      trend: trends[c],
    }
  })

  ranking.sort((a, b) => b.qualityScore - a.qualityScore)
  return ranking.map((r, i) => ({ ...r, rank: i + 1 }))
}

export function buildAnomalyMatrix(windowDays: number): AnomalyMatrixCell[] {
  const data = getRawSamplesByTimeWindow(windowDays)
  const matrix: AnomalyMatrixCell[] = []
  const anomalyKinds = [
    { key: 'duration', name: '时长异常' },
    { key: 'skip', name: '跳题异常' },
    { key: 'ip', name: 'IP异常' },
    { key: 'device', name: '设备异常' },
    { key: 'duplicate', name: '重复提交' },
    { key: 'quality', name: '质检不通过' },
  ]

  for (let c = 0; c < 6; c++) {
    const channelSamples = data.filter(s => s.channelIdx === c)
    const total = channelSamples.length

    for (const ak of anomalyKinds) {
      const count = channelSamples.filter(s => s.anomalyTypes.includes(ak.key)).length
      const rate = total > 0 ? count / total : 0
      let level: 'low' | 'medium' | 'high' | 'critical' = 'low'
      if (rate > 0.04) level = 'medium'
      if (rate > 0.06) level = 'high'
      if (rate > 0.08) level = 'critical'

      matrix.push({
        channelId: channelIds[c],
        channelName: channels[c],
        anomalyType: ak.key,
        anomalyTypeName: ak.name,
        count,
        rate,
        level,
      })
    }
  }

  return matrix
}

export function buildQuestionGroupDurations(windowDays: number): QuestionGroupDuration[] {
  const data = getRawSamplesByTimeWindow(windowDays)
  const groupIds = ['g1', 'g2', 'g3', 'g4']
  const groupNames = ['基本信息题组', '产品使用题组', '满意度评价题组', '开放建议题组']

  return groupIds.map((gid, i) => {
    const allDurs = data.map(s => s.groupDurations[gid]).filter(Boolean)
    allDurs.sort((a, b) => a - b)
    const len = allDurs.length

    const q1Idx = Math.floor(len * 0.25)
    const medIdx = Math.floor(len * 0.5)
    const q3Idx = Math.floor(len * 0.75)
    const q1 = allDurs[q1Idx]
    const median = allDurs[medIdx]
    const q3 = allDurs[q3Idx]
    const iqr = q3 - q1
    const lower = q1 - 1.5 * iqr
    const upper = q3 + 1.5 * iqr

    const outliers = allDurs.filter(d => d < lower || d > upper)
    const normalDurs = allDurs.filter(d => d >= lower && d <= upper)

    return {
      groupId: gid,
      groupName: groupNames[i],
      min: normalDurs[0] || 0,
      q1,
      median,
      q3,
      max: normalDurs[normalDurs.length - 1] || 0,
      mean: Math.floor(normalDurs.reduce((a, b) => a + b, 0) / normalDurs.length),
      outliers: outliers.slice(0, 5),
    }
  })
}

export function buildComparisonData(dimension: string, windowDays: number): ComparisonData[] {
  const data = getRawSamplesByTimeWindow(windowDays)
  const dimConfig: Record<string, { count: number; getName: (i: number) => string }> = {
    survey: { count: 4, getName: (i: number) => surveys[i] },
    channel: { count: 6, getName: (i: number) => channels[i] },
    questionGroup: { count: 4, getName: (i: number) => ['基本信息题组', '产品使用题组', '满意度评价题组', '开放建议题组'][i] },
    region: { count: 5, getName: (i: number) => regions[i] },
    device: { count: 4, getName: (i: number) => devices[i] },
  }

  const cfg = dimConfig[dimension]
  if (!cfg) return []

  const results: ComparisonData[] = []

  for (let i = 0; i < cfg.count; i++) {
    let list: RawSampleRecord[]
    if (dimension === 'survey') list = data.filter(s => s.surveyIdx === i)
    else if (dimension === 'channel') list = data.filter(s => s.channelIdx === i)
    else if (dimension === 'region') list = data.filter(s => s.regionIdx === i)
    else if (dimension === 'device') list = data.filter(s => s.deviceIdx === i)
    else if (dimension === 'questionGroup') {
      list = data
      const gid = `g${i + 1}`
      const total = list.length
      const valid = list.filter(s => s.qualityMark !== 'fail').length
      const skipCount = list.filter(s => s.groupDurations[gid] < 10).length
      results.push({
        dimension,
        dimensionValue: cfg.getName(i),
        metrics: {
          totalSamples: total,
          validSamples: valid,
          anomalyRate: total > 0 ? list.filter(s => s.anomalyTypes.length > 0).length / total : 0,
          avgDuration: Math.floor(list.reduce((sum, s) => sum + s.groupDurations[gid], 0) / total),
          skipRate: total > 0 ? skipCount / total : 0,
          duplicateRate: 0,
          ipAbnormalRate: 0,
          deviceAbnormalRate: 0,
          qualityMarkRate: total > 0 ? list.filter(s => s.qualityMark !== 'pass').length / total : 0,
        },
      })
      continue
    } else {
      list = []
    }

    const total = list.length
    const valid = list.filter(s => s.qualityMark !== 'fail').length
    const anomaly = list.filter(s => s.anomalyTypes.length > 0).length
    const skip = list.filter(s => s.skipCount > 5).length
    const dup = list.filter(s => s.anomalyTypes.includes('duplicate')).length
    const ipAbn = list.filter(s => s.anomalyTypes.includes('ip')).length
    const devAbn = list.filter(s => s.anomalyTypes.includes('device')).length
    const qMark = list.filter(s => s.qualityMark !== 'pass').length

    results.push({
      dimension,
      dimensionValue: cfg.getName(i),
      metrics: {
        totalSamples: total,
        validSamples: valid,
        anomalyRate: total > 0 ? anomaly / total : 0,
        avgDuration: total > 0 ? Math.floor(list.reduce((sum, s) => sum + s.duration, 0) / total) : 0,
        skipRate: total > 0 ? skip / total : 0,
        duplicateRate: total > 0 ? dup / total : 0,
        ipAbnormalRate: total > 0 ? ipAbn / total : 0,
        deviceAbnormalRate: total > 0 ? devAbn / total : 0,
        qualityMarkRate: total > 0 ? qMark / total : 0,
      },
    })
  }

  return results
}

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
  const sampleNum = parseInt(sampleId.slice(-4))
  const isFast = sampleNum % 7 < 2
  let time = 0
  return questions.map((q, i) => {
    const baseDuration = isFast ? 2 + Math.floor((sampleNum + i) % 6) : 8 + Math.floor((sampleNum + i) % 35)
    const isSkipped = isFast && i > 5
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
      answerValue: isSkipped ? '' : ['A', 'B', 'C', 'D'][(sampleNum + i) % 4],
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
    targetId: 'SAMPLE-2024060700001',
    content: '该样本答题时长异常短（42秒），且选项高度一致，判定为无效样本，已标记剔除。',
    tags: ['无效样本', '机器人'],
    author: '张三',
    createTime: '2024-06-15 14:30:00',
    updateTime: '2024-06-15 14:30:00',
  },
  {
    noteId: 'n2',
    targetType: 'sample',
    targetId: 'SAMPLE-2024060700004',
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
    targetId: 'SAMPLE-2024060700011',
    content: '测谎题未通过，逻辑矛盾，已标记。',
    tags: ['质检不通过', '逻辑矛盾'],
    author: '张三',
    createTime: '2024-06-13 16:45:00',
    updateTime: '2024-06-13 16:45:00',
  },
]
