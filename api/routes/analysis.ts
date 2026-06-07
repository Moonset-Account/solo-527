import { Router, type Request, type Response } from 'express'
import { mockRecords } from '../data/mockData.js'

const router = Router()

router.get('/overview', (req: Request, res: Response) => {
  const timeRange = req.query.timeRange as string || '30'
  const days = parseInt(timeRange, 10)
  const now = new Date('2026-05-31')
  const start = new Date(now.getTime() - days * 86400000)
  const startStr = start.toISOString().split('T')[0]

  const filtered = mockRecords.filter(r => r.appointmentDate >= startStr)
  const total = filtered.length
  const completed = filtered.filter(r => r.status === 'completed').length
  const cancelled = filtered.filter(r => r.status === 'cancelled').length
  const noShow = filtered.filter(r => r.status === 'noShow').length
  const cancelRate = total > 0 ? Math.round((cancelled / (completed + cancelled + noShow)) * 10000) / 100 : 0
  const withWait = filtered.filter(r => ['appointed', 'completed'].includes(r.status))
  const avgWaitDays = withWait.length > 0
    ? Math.round((withWait.reduce((s, r) => s + r.waitDays, 0) / withWait.length) * 100) / 100
    : 0
  const followUpRate = completed > 0
    ? Math.round((filtered.filter(r => r.status === 'completed' && r.followUpStatus === 'completed').length / completed) * 10000) / 100
    : 0

  const trendMap = new Map<string, { total: number; cancelled: number }>()
  for (const r of filtered) {
    const key = r.appointmentDate
    if (!trendMap.has(key)) trendMap.set(key, { total: 0, cancelled: 0 })
    trendMap.get(key)!.total++
    if (r.status === 'cancelled') trendMap.get(key)!.cancelled++
  }
  const trend = Array.from(trendMap.entries())
    .map(([date, v]) => ({ date, total: v.total, cancelled: v.cancelled }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const anomalies: Array<{ metric: string; value: number; expected: number; direction: string }> = []
  if (cancelRate > 25) anomalies.push({ metric: '取消率', value: cancelRate, expected: 20, direction: 'up' })
  if (avgWaitDays > 7) anomalies.push({ metric: '平均等待天数', value: avgWaitDays, expected: 5, direction: 'up' })
  if (followUpRate < 50) anomalies.push({ metric: '回访完成率', value: followUpRate, expected: 60, direction: 'down' })

  res.json({ total, completed, cancelled, noShow, cancelRate, avgWaitDays, followUpRate, trend, anomalies })
})

router.get('/wait-distribution', (_req: Request, res: Response) => {
  const buckets = [
    { range: '0-3天', min: 0, max: 3, count: 0 },
    { range: '3-7天', min: 3, max: 7, count: 0 },
    { range: '7-14天', min: 7, max: 14, count: 0 },
    { range: '14天以上', min: 14, max: 999, count: 0 },
  ]
  const withWait = mockRecords.filter(r => ['appointed', 'completed'].includes(r.status))
  for (const r of withWait) {
    const b = buckets.find(b => r.waitDays >= b.min && r.waitDays < b.max)
    if (b) b.count++
  }
  res.json(buckets.map(b => ({ range: b.range, count: b.count })))
})

router.get('/cancel-reasons', (_req: Request, res: Response) => {
  const reasonMap = new Map<string, number>()
  for (const r of mockRecords) {
    if (r.cancelReason) {
      reasonMap.set(r.cancelReason, (reasonMap.get(r.cancelReason) || 0) + 1)
    }
  }
  const total = Array.from(reasonMap.values()).reduce((s, v) => s + v, 0)
  res.json(Array.from(reasonMap.entries()).map(([reason, count]) => ({
    reason,
    count,
    rate: Math.round((count / total) * 10000) / 100,
  })).sort((a, b) => b.count - a.count))
})

router.get('/channel-trend', (req: Request, res: Response) => {
  const channels = ['线上预约', '线下窗口', '辅导员转介', '家长转介', '朋辈推荐']
  const months = new Map<string, Record<string, number>>()
  for (const r of mockRecords) {
    const month = r.appointmentDate.substring(0, 7)
    if (!months.has(month)) {
      const entry: Record<string, number> = {}
      for (const c of channels) entry[c] = 0
      months.set(month, entry)
    }
    months.get(month)![r.channel] = (months.get(month)![r.channel] || 0) + 1
  }
  const result = Array.from(months.entries())
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month))
  res.json(result)
})

router.get('/followup-funnel', (_req: Request, res: Response) => {
  const total = mockRecords.length
  const completed = mockRecords.filter(r => r.status === 'completed').length
  const firstVisit = mockRecords.filter(r => r.status === 'completed').length
  const followUpCompleted = mockRecords.filter(r => r.status === 'completed' && r.followUpStatus === 'completed').length
  res.json([
    { stage: '预约', count: total, rate: 100 },
    { stage: '到场', count: completed, rate: Math.round((completed / total) * 10000) / 100 },
    { stage: '首次咨询', count: firstVisit, rate: Math.round((firstVisit / total) * 10000) / 100 },
    { stage: '完成回访', count: followUpCompleted, rate: Math.round((followUpCompleted / total) * 10000) / 100 },
  ])
})

router.get('/map-data', (_req: Request, res: Response) => {
  const areaMap = new Map<string, { count: number; lng: number; lat: number }>()
  for (const r of mockRecords) {
    if (!areaMap.has(r.buildingArea)) {
      areaMap.set(r.buildingArea, { count: 0, lng: 0, lat: 0 })
    }
    const entry = areaMap.get(r.buildingArea)!
    entry.count++
    entry.lng += r.lng
    entry.lat += r.lat
  }
  const result = Array.from(areaMap.entries()).map(([area, data]) => ({
    area,
    count: data.count,
    lng: data.lng / data.count,
    lat: data.lat / data.count,
  }))
  res.json(result)
})

export default router
