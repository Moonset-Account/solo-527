import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'
import { getCache, setCache, clearCache } from '../cache.js'
import type { FilterState, WeeklyReportData, MetaInfo } from '../types.ts'

const router = Router()

const DEFAULT_FILTER: FilterState = {
  collectionTypes: [],
  readerGroups: [],
  themes: [],
  branches: [],
  dateRange: { start: '2024-01-01', end: '2025-05-31' },
}

function buildWhere(filter: FilterState): { where: string; params: unknown[] } {
  const clauses: string[] = []
  const params: unknown[] = []
  clauses.push('br.borrow_date >= ? AND br.borrow_date <= ?')
  params.push(filter.dateRange.start, filter.dateRange.end)
  if (filter.branches.length > 0) {
    clauses.push(`br.branch_id IN (${filter.branches.map(() => '?').join(',')})`)
    params.push(...filter.branches)
  }
  if (filter.themes.length > 0) {
    clauses.push(`b.theme_category IN (${filter.themes.map(() => '?').join(',')})`)
    params.push(...filter.themes)
  }
  if (filter.readerGroups.length > 0) {
    clauses.push(`r.age_group IN (${filter.readerGroups.map(() => '?').join(',')})`)
    params.push(...filter.readerGroups)
  }
  if (filter.collectionTypes.length > 0) {
    clauses.push(`b.collection_type IN (${filter.collectionTypes.map(() => '?').join(',')})`)
    params.push(...filter.collectionTypes)
  }
  return { where: clauses.join(' AND '), params }
}

function pctChange(curr: number, prev: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0
  return parseFloat((((curr - prev) / prev) * 100).toFixed(1))
}

router.get('/', (_req: Request, res: Response): void => {
  const cacheKey = { route: 'weekly-reports-list' }
  const cached = getCache<{ data: WeeklyReportData[]; meta: MetaInfo }>(cacheKey)
  if (cached) {
    res.json({ success: true, ...cached, meta: { ...cached.meta, cacheHit: true } })
    return
  }

  const db = getDb()
  const reports = db.prepare(
    `SELECT report_id, week_start, week_end, key_changes, yoy_comparison, mom_comparison, anomalies, filter_snapshot, generated_at
     FROM weekly_report ORDER BY week_start DESC`
  ).all() as { report_id: string; week_start: string; week_end: string; key_changes: string; yoy_comparison: string; mom_comparison: string; anomalies: string; filter_snapshot: string; generated_at: string }[]

  const data = reports.map(r => ({
    reportId: r.report_id,
    weekStart: r.week_start,
    weekEnd: r.week_end,
    keyChanges: JSON.parse(r.key_changes),
    yoyComparison: JSON.parse(r.yoy_comparison),
    momComparison: JSON.parse(r.mom_comparison),
    anomalies: JSON.parse(r.anomalies),
    filterSnapshot: JSON.parse(r.filter_snapshot),
    generatedAt: r.generated_at,
  }))

  const updatedAtRow = db.prepare('SELECT MAX(updated_at) as updated_at FROM update_log').get() as { updated_at: string | null }
  const meta: MetaInfo = {
    updatedAt: updatedAtRow.updated_at ?? new Date().toISOString(),
    cacheHit: false,
    filterSnapshot: DEFAULT_FILTER,
    childDataAggregated: true,
  }

  const result = { data, meta }
  setCache(cacheKey, result)
  res.json({ success: true, ...result })
})

router.get('/:id', (req: Request, res: Response): void => {
  const cacheKey = { route: 'weekly-reports-detail', id: req.params.id }
  const cached = getCache<{ data: WeeklyReportData; meta: MetaInfo }>(cacheKey)
  if (cached) {
    res.json({ success: true, ...cached, meta: { ...cached.meta, cacheHit: true } })
    return
  }

  const db = getDb()
  const r = db.prepare(
    `SELECT report_id, week_start, week_end, key_changes, yoy_comparison, mom_comparison, anomalies, filter_snapshot, generated_at
     FROM weekly_report WHERE report_id = ?`
  ).get(req.params.id) as { report_id: string; week_start: string; week_end: string; key_changes: string; yoy_comparison: string; mom_comparison: string; anomalies: string; filter_snapshot: string; generated_at: string } | undefined

  if (!r) {
    res.status(404).json({ success: false, error: 'Report not found' })
    return
  }

  const data: WeeklyReportData = {
    reportId: r.report_id,
    weekStart: r.week_start,
    weekEnd: r.week_end,
    keyChanges: JSON.parse(r.key_changes),
    yoyComparison: JSON.parse(r.yoy_comparison),
    momComparison: JSON.parse(r.mom_comparison),
    anomalies: JSON.parse(r.anomalies),
    filterSnapshot: JSON.parse(r.filter_snapshot),
    generatedAt: r.generated_at,
  }

  const updatedAtRow = db.prepare('SELECT MAX(updated_at) as updated_at FROM update_log').get() as { updated_at: string | null }
  const meta: MetaInfo = {
    updatedAt: updatedAtRow.updated_at ?? new Date().toISOString(),
    cacheHit: false,
    filterSnapshot: data.filterSnapshot,
    childDataAggregated: true,
  }

  const result = { data, meta }
  setCache(cacheKey, result)
  res.json({ success: true, ...result })
})

router.post('/generate', (req: Request, res: Response): void => {
  const filter: FilterState = req.body?.filters ?? req.body ?? DEFAULT_FILTER

  if (!filter.dateRange?.start || !filter.dateRange?.end) {
    filter.dateRange = DEFAULT_FILTER.dateRange
  }

  const db = getDb()
  const baseJoin = `borrow_record br JOIN reader r ON br.reader_id = r.reader_id JOIN book b ON br.book_id = b.book_id`

  const { where, params } = buildWhere(filter)

  const currentStats = db.prepare(
    `SELECT COUNT(*) as totalBorrows,
       SUM(CASE WHEN br.is_renewed = 1 THEN 1 ELSE 0 END) as renewals,
       SUM(CASE WHEN br.is_overdue = 1 THEN 1 ELSE 0 END) as overdues
     FROM ${baseJoin} WHERE ${where}`
  ).get(...params) as { totalBorrows: number; renewals: number; overdues: number }

  const startDate = new Date(filter.dateRange.start)
  const endDate = new Date(filter.dateRange.end)
  const diffMs = endDate.getTime() - startDate.getTime()

  const momEnd = new Date(startDate)
  momEnd.setDate(momEnd.getDate() - 1)
  const momStart = new Date(momEnd.getTime() - diffMs)
  const momFilter: FilterState = { ...filter, dateRange: { start: momStart.toISOString().slice(0, 10), end: momEnd.toISOString().slice(0, 10) } }
  const { where: momWhere, params: momParams } = buildWhere(momFilter)

  const prevStats = db.prepare(
    `SELECT COUNT(*) as totalBorrows,
       SUM(CASE WHEN br.is_renewed = 1 THEN 1 ELSE 0 END) as renewals,
       SUM(CASE WHEN br.is_overdue = 1 THEN 1 ELSE 0 END) as overdues
     FROM ${baseJoin} WHERE ${momWhere}`
  ).get(...momParams) as { totalBorrows: number; renewals: number; overdues: number }

  const yoyStart = new Date(startDate)
  yoyStart.setFullYear(yoyStart.getFullYear() - 1)
  const yoyEnd = new Date(yoyStart.getTime() + diffMs)
  const yoyFilter: FilterState = { ...filter, dateRange: { start: yoyStart.toISOString().slice(0, 10), end: yoyEnd.toISOString().slice(0, 10) } }
  const { where: yoyWhere, params: yoyParams } = buildWhere(yoyFilter)

  const yoyStats = db.prepare(
    `SELECT COUNT(*) as totalBorrows,
       SUM(CASE WHEN br.is_renewed = 1 THEN 1 ELSE 0 END) as renewals,
       SUM(CASE WHEN br.is_overdue = 1 THEN 1 ELSE 0 END) as overdues
     FROM ${baseJoin} WHERE ${yoyWhere}`
  ).get(...yoyParams) as { totalBorrows: number; renewals: number; overdues: number }

  const resBaseJoin = `reservation rv JOIN reader r ON rv.reader_id = r.reader_id JOIN book b ON rv.book_id = b.book_id`

  function queryResStats(dateStart: string, dateEnd: string): { total: number; fulfilled: number; fulfillRate: number } {
    const rWhere = `rv.reserve_date >= ? AND rv.reserve_date <= ?${filter.branches.length > 0 ? ` AND rv.branch_id IN (${filter.branches.map(() => '?').join(',')})` : ''}${filter.themes.length > 0 ? ` AND b.theme_category IN (${filter.themes.map(() => '?').join(',')})` : ''}${filter.readerGroups.length > 0 ? ` AND r.age_group IN (${filter.readerGroups.map(() => '?').join(',')})` : ''}${filter.collectionTypes.length > 0 ? ` AND b.collection_type IN (${filter.collectionTypes.map(() => '?').join(',')})` : ''}`
    const rParams = [dateStart, dateEnd, ...filter.branches, ...filter.themes, ...filter.readerGroups, ...filter.collectionTypes]
    const stats = db.prepare(
      `SELECT COUNT(*) as total, SUM(CASE WHEN rv.status = 'fulfilled' THEN 1 ELSE 0 END) as fulfilled FROM ${resBaseJoin} WHERE ${rWhere}`
    ).get(...rParams) as { total: number; fulfilled: number }
    return { total: stats.total, fulfilled: stats.fulfilled ?? 0, fulfillRate: stats.total > 0 ? parseFloat(((stats.fulfilled / stats.total) * 100).toFixed(1)) : 0 }
  }

  const currentResStats = queryResStats(filter.dateRange.start, filter.dateRange.end)
  const fulfillRate = currentResStats.fulfillRate

  const prevResStats = queryResStats(momFilter.dateRange.start, momFilter.dateRange.end)
  const prevFulfillRate = prevResStats.fulfillRate

  const yoyResStats = queryResStats(yoyFilter.dateRange.start, yoyFilter.dateRange.end)

  const overdueRate = currentStats.totalBorrows > 0 ? parseFloat(((currentStats.overdues / currentStats.totalBorrows) * 100).toFixed(1)) : 0
  const renewalRate = currentStats.totalBorrows > 0 ? parseFloat(((currentStats.renewals / currentStats.totalBorrows) * 100).toFixed(1)) : 0

  const prevOverdueRate = prevStats.totalBorrows > 0 ? parseFloat(((prevStats.overdues / prevStats.totalBorrows) * 100).toFixed(1)) : 0
  const prevRenewalRate = prevStats.totalBorrows > 0 ? parseFloat(((prevStats.renewals / prevStats.totalBorrows) * 100).toFixed(1)) : 0

  const keyChanges: string[] = []
  const anomalies: { type: string; description: string; severity: 'high' | 'medium' | 'low' }[] = []

  const borrowChange = pctChange(currentStats.totalBorrows, prevStats.totalBorrows)
  if (borrowChange !== 0) keyChanges.push(`借阅量环比${borrowChange > 0 ? '增长' : '下降'}${Math.abs(borrowChange)}%`)

  const borrowYoy = pctChange(currentStats.totalBorrows, yoyStats.totalBorrows)
  if (borrowYoy !== 0) keyChanges.push(`借阅量同比${borrowYoy > 0 ? '增长' : '下降'}${Math.abs(borrowYoy)}%`)

  if (overdueRate > 15) keyChanges.push(`逾期率${overdueRate}%，超过阈值`)
  if (fulfillRate < 70) keyChanges.push(`预约满足率${fulfillRate}%，低于70%`)

  if (Math.abs(borrowChange) > 20) {
    anomalies.push({ type: 'borrow_spike', description: `借阅量环比变化幅度异常: ${borrowChange > 0 ? '+' : ''}${borrowChange}%`, severity: Math.abs(borrowChange) > 40 ? 'high' : 'medium' })
  }

  const overdueChange = pctChange(currentStats.overdues ?? 0, prevStats.overdues ?? 0)
  if (overdueChange > 10) {
    anomalies.push({ type: 'overdue_increase', description: `逾期量环比增长${overdueChange}%`, severity: overdueChange > 30 ? 'high' : 'medium' })
  }
  if (overdueRate > 15) {
    anomalies.push({ type: 'overdue_high', description: `逾期率${overdueRate}%超过阈值15%`, severity: overdueRate > 25 ? 'high' : 'medium' })
  }
  if (renewalRate < 20) {
    anomalies.push({ type: 'renewal_low', description: `续借率${renewalRate}%偏低`, severity: 'low' })
  }
  if (fulfillRate < 70 && fulfillRate > 0) {
    anomalies.push({ type: 'fulfill_low', description: `预约满足率${fulfillRate}%低于70%`, severity: fulfillRate < 50 ? 'high' : 'medium' })
  }

  if (keyChanges.length === 0) keyChanges.push('当前筛选范围内数据无明显变化')
  if (anomalies.length === 0) anomalies.push({ type: 'none', description: '未检测到异常', severity: 'low' })

  const yoyComparison = [
    { metric: '借阅量', current: currentStats.totalBorrows, previous: yoyStats.totalBorrows, change: borrowYoy },
    { metric: '续借数', current: currentStats.renewals ?? 0, previous: yoyStats.renewals ?? 0, change: pctChange(currentStats.renewals ?? 0, yoyStats.renewals ?? 0) },
    { metric: '逾期数', current: currentStats.overdues ?? 0, previous: yoyStats.overdues ?? 0, change: pctChange(currentStats.overdues ?? 0, yoyStats.overdues ?? 0) },
    { metric: '预约满足率(%)', current: fulfillRate, previous: yoyResStats.fulfillRate, change: pctChange(fulfillRate, yoyResStats.fulfillRate) },
  ]

  const momComparison = [
    { metric: '借阅量', current: currentStats.totalBorrows, previous: prevStats.totalBorrows, change: borrowChange },
    { metric: '续借率(%)', current: renewalRate, previous: prevRenewalRate, change: pctChange(renewalRate, prevRenewalRate) },
    { metric: '逾期率(%)', current: overdueRate, previous: prevOverdueRate, change: pctChange(overdueRate, prevOverdueRate) },
    { metric: '预约满足率(%)', current: fulfillRate, previous: prevFulfillRate, change: pctChange(fulfillRate, prevFulfillRate) },
  ]

  const reportId = `WR-${Date.now()}`
  const filterSnapshot = { ...filter }

  db.prepare(
    `INSERT INTO weekly_report (report_id, week_start, week_end, key_changes, yoy_comparison, mom_comparison, anomalies, filter_snapshot)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    reportId,
    filter.dateRange.start,
    filter.dateRange.end,
    JSON.stringify(keyChanges),
    JSON.stringify(yoyComparison),
    JSON.stringify(momComparison),
    JSON.stringify(anomalies),
    JSON.stringify(filterSnapshot),
  )

  clearCache()

  const data: WeeklyReportData = {
    reportId,
    weekStart: filter.dateRange.start,
    weekEnd: filter.dateRange.end,
    keyChanges,
    yoyComparison,
    momComparison,
    anomalies,
    filterSnapshot,
    generatedAt: new Date().toISOString(),
  }

  const updatedAtRow = db.prepare('SELECT MAX(updated_at) as updated_at FROM update_log').get() as { updated_at: string | null }
  const meta: MetaInfo = {
    updatedAt: updatedAtRow.updated_at ?? new Date().toISOString(),
    cacheHit: false,
    filterSnapshot,
    childDataAggregated: true,
  }

  res.json({ success: true, data, meta })
})

export default router
