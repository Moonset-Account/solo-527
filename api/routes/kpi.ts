import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'
import { getCache, setCache } from '../cache.js'
import type { FilterState, KpiData, MetaInfo } from '../types.ts'

const router = Router()

function buildFilterClauses(filter: FilterState): { where: string; params: unknown[] } {
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

function buildYoyParams(filter: FilterState): { where: string; params: unknown[] } {
  const start = new Date(filter.dateRange.start)
  const end = new Date(filter.dateRange.end)
  const diffMs = end.getTime() - start.getTime()
  const yoyStart = new Date(start.getTime())
  yoyStart.setFullYear(yoyStart.getFullYear() - 1)
  const yoyEnd = new Date(yoyStart.getTime() + diffMs)

  const yoyFilter: FilterState = {
    ...filter,
    dateRange: { start: yoyStart.toISOString().slice(0, 10), end: yoyEnd.toISOString().slice(0, 10) },
  }
  return buildFilterClauses(yoyFilter)
}

function buildMomParams(filter: FilterState): { where: string; params: unknown[] } {
  const start = new Date(filter.dateRange.start)
  const end = new Date(filter.dateRange.end)
  const diffMs = end.getTime() - start.getTime()
  const momEnd = new Date(start.getTime())
  momEnd.setDate(momEnd.getDate() - 1)
  const momStart = new Date(momEnd.getTime() - diffMs)

  const momFilter: FilterState = {
    ...filter,
    dateRange: { start: momStart.toISOString().slice(0, 10), end: momEnd.toISOString().slice(0, 10) },
  }
  return buildFilterClauses(momFilter)
}

function calcChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return parseFloat((((current - previous) / previous) * 100).toFixed(1))
}

router.post('/', (req: Request, res: Response): void => {
  const filter: FilterState = req.body?.filters ?? req.body
  const cacheKey = { route: 'kpi', filters: filter }
  const cached = getCache<{ data: KpiData; meta: MetaInfo }>(cacheKey)
  if (cached) {
    res.json({ success: true, ...cached, meta: { ...cached.meta, cacheHit: true } })
    return
  }
  const db = getDb()

  const { where, params } = buildFilterClauses(filter)
  const { where: yoyWhere, params: yoyParams } = buildYoyParams(filter)
  const { where: momWhere, params: momParams } = buildMomParams(filter)

  const baseJoin = `borrow_record br JOIN reader r ON br.reader_id = r.reader_id JOIN book b ON br.book_id = b.book_id`

  const borrowCount = (db.prepare(`SELECT COUNT(*) as value FROM ${baseJoin} WHERE ${where}`).get(...params) as { value: number }).value
  const borrowCountYoy = (db.prepare(`SELECT COUNT(*) as value FROM ${baseJoin} WHERE ${yoyWhere}`).get(...yoyParams) as { value: number }).value
  const borrowCountMom = (db.prepare(`SELECT COUNT(*) as value FROM ${baseJoin} WHERE ${momWhere}`).get(...momParams) as { value: number }).value

  const renewalStats = db.prepare(`SELECT COUNT(*) as total, SUM(CASE WHEN br.is_renewed = 1 THEN 1 ELSE 0 END) as renewed FROM ${baseJoin} WHERE ${where}`).get(...params) as { total: number; renewed: number }
  const renewalStatsYoy = db.prepare(`SELECT COUNT(*) as total, SUM(CASE WHEN br.is_renewed = 1 THEN 1 ELSE 0 END) as renewed FROM ${baseJoin} WHERE ${yoyWhere}`).get(...yoyParams) as { total: number; renewed: number }
  const renewalStatsMom = db.prepare(`SELECT COUNT(*) as total, SUM(CASE WHEN br.is_renewed = 1 THEN 1 ELSE 0 END) as renewed FROM ${baseJoin} WHERE ${momWhere}`).get(...momParams) as { total: number; renewed: number }

  const renewalRate = renewalStats.total > 0 ? parseFloat(((renewalStats.renewed / renewalStats.total) * 100).toFixed(1)) : 0
  const renewalRateYoy = renewalStatsYoy.total > 0 ? parseFloat(((renewalStatsYoy.renewed / renewalStatsYoy.total) * 100).toFixed(1)) : 0
  const renewalRateMom = renewalStatsMom.total > 0 ? parseFloat(((renewalStatsMom.renewed / renewalStatsMom.total) * 100).toFixed(1)) : 0

  const resBaseJoin = `reservation rv JOIN reader r ON rv.reader_id = r.reader_id JOIN book b ON rv.book_id = b.book_id`

  const fulfillStats = db.prepare(`SELECT COUNT(*) as total, SUM(CASE WHEN rv.status = 'fulfilled' THEN 1 ELSE 0 END) as fulfilled FROM ${resBaseJoin} WHERE rv.reserve_date >= ? AND rv.reserve_date <= ? ${filter.branches.length > 0 ? `AND rv.branch_id IN (${filter.branches.map(() => '?').join(',')})` : ''} ${filter.themes.length > 0 ? `AND b.theme_category IN (${filter.themes.map(() => '?').join(',')})` : ''} ${filter.readerGroups.length > 0 ? `AND r.age_group IN (${filter.readerGroups.map(() => '?').join(',')})` : ''} ${filter.collectionTypes.length > 0 ? `AND b.collection_type IN (${filter.collectionTypes.map(() => '?').join(',')})` : ''}`).get(filter.dateRange.start, filter.dateRange.end, ...filter.branches, ...filter.themes, ...filter.readerGroups, ...filter.collectionTypes) as { total: number; fulfilled: number }

  const fulfillRate = fulfillStats.total > 0 ? parseFloat(((fulfillStats.fulfilled / fulfillStats.total) * 100).toFixed(1)) : 0

  const yoyStart = new Date(filter.dateRange.start)
  yoyStart.setFullYear(yoyStart.getFullYear() - 1)
  const yoyEnd = new Date(filter.dateRange.end)
  yoyEnd.setFullYear(yoyEnd.getFullYear() - 1)

  const fulfillStatsYoy = db.prepare(`SELECT COUNT(*) as total, SUM(CASE WHEN rv.status = 'fulfilled' THEN 1 ELSE 0 END) as fulfilled FROM ${resBaseJoin} WHERE rv.reserve_date >= ? AND rv.reserve_date <= ? ${filter.branches.length > 0 ? `AND rv.branch_id IN (${filter.branches.map(() => '?').join(',')})` : ''} ${filter.themes.length > 0 ? `AND b.theme_category IN (${filter.themes.map(() => '?').join(',')})` : ''} ${filter.readerGroups.length > 0 ? `AND r.age_group IN (${filter.readerGroups.map(() => '?').join(',')})` : ''} ${filter.collectionTypes.length > 0 ? `AND b.collection_type IN (${filter.collectionTypes.map(() => '?').join(',')})` : ''}`).get(yoyStart.toISOString().slice(0, 10), yoyEnd.toISOString().slice(0, 10), ...filter.branches, ...filter.themes, ...filter.readerGroups, ...filter.collectionTypes) as { total: number; fulfilled: number }

  const fulfillRateYoy = fulfillStatsYoy.total > 0 ? parseFloat(((fulfillStatsYoy.fulfilled / fulfillStatsYoy.total) * 100).toFixed(1)) : 0

  const overdueStats = db.prepare(`SELECT COUNT(*) as total, SUM(CASE WHEN br.is_overdue = 1 THEN 1 ELSE 0 END) as overdue FROM ${baseJoin} WHERE ${where}`).get(...params) as { total: number; overdue: number }
  const overdueStatsYoy = db.prepare(`SELECT COUNT(*) as total, SUM(CASE WHEN br.is_overdue = 1 THEN 1 ELSE 0 END) as overdue FROM ${baseJoin} WHERE ${yoyWhere}`).get(...yoyParams) as { total: number; overdue: number }
  const overdueStatsMom = db.prepare(`SELECT COUNT(*) as total, SUM(CASE WHEN br.is_overdue = 1 THEN 1 ELSE 0 END) as overdue FROM ${baseJoin} WHERE ${momWhere}`).get(...momParams) as { total: number; overdue: number }

  const overdueRate = overdueStats.total > 0 ? parseFloat(((overdueStats.overdue / overdueStats.total) * 100).toFixed(1)) : 0
  const overdueRateYoy = overdueStatsYoy.total > 0 ? parseFloat(((overdueStatsYoy.overdue / overdueStatsYoy.total) * 100).toFixed(1)) : 0
  const overdueRateMom = overdueStatsMom.total > 0 ? parseFloat(((overdueStatsMom.overdue / overdueStatsMom.total) * 100).toFixed(1)) : 0

  const borrowTrend = db.prepare(`SELECT strftime('%Y-W%W', br.borrow_date) as week, COUNT(*) as value FROM ${baseJoin} WHERE ${where} GROUP BY week ORDER BY week DESC LIMIT 12`).all(...params) as { week: string; value: number }[]
  const renewalTrend = db.prepare(`SELECT strftime('%Y-W%W', br.borrow_date) as week, COUNT(*) as total, SUM(CASE WHEN br.is_renewed = 1 THEN 1 ELSE 0 END) as renewed FROM ${baseJoin} WHERE ${where} GROUP BY week ORDER BY week DESC LIMIT 12`).all(...params) as { week: string; total: number; renewed: number }[]
  const overdueTrend = db.prepare(`SELECT strftime('%Y-W%W', br.borrow_date) as week, COUNT(*) as total, SUM(CASE WHEN br.is_overdue = 1 THEN 1 ELSE 0 END) as overdue FROM ${baseJoin} WHERE ${where} GROUP BY week ORDER BY week DESC LIMIT 12`).all(...params) as { week: string; total: number; overdue: number }[]

  const fulfillTrend = db.prepare(`SELECT strftime('%Y-W%W', rv.reserve_date) as week, COUNT(*) as total, SUM(CASE WHEN rv.status = 'fulfilled' THEN 1 ELSE 0 END) as fulfilled FROM reservation rv JOIN book b ON rv.book_id = b.book_id JOIN reader r ON rv.reader_id = r.reader_id WHERE rv.reserve_date >= ? AND rv.reserve_date <= ? ${filter.branches.length > 0 ? `AND rv.branch_id IN (${filter.branches.map(() => '?').join(',')})` : ''} ${filter.themes.length > 0 ? `AND b.theme_category IN (${filter.themes.map(() => '?').join(',')})` : ''} ${filter.readerGroups.length > 0 ? `AND r.age_group IN (${filter.readerGroups.map(() => '?').join(',')})` : ''} ${filter.collectionTypes.length > 0 ? `AND b.collection_type IN (${filter.collectionTypes.map(() => '?').join(',')})` : ''} GROUP BY week ORDER BY week DESC LIMIT 12`).all(filter.dateRange.start, filter.dateRange.end, ...filter.branches, ...filter.themes, ...filter.readerGroups, ...filter.collectionTypes) as { week: string; total: number; fulfilled: number }[]

  const borrowYoyChange = calcChange(borrowCount, borrowCountYoy)
  const borrowMomChange = calcChange(borrowCount, borrowCountMom)
  const renewalYoyChange = calcChange(renewalRate, renewalRateYoy)
  const renewalMomChange = calcChange(renewalRate, renewalRateMom)
  const fulfillYoyChange = calcChange(fulfillRate, fulfillRateYoy)
  const overdueYoyChange = calcChange(overdueRate, overdueRateYoy)
  const overdueMomChange = calcChange(overdueRate, overdueRateMom)

  const data: KpiData = {
    borrowCount: {
      value: borrowCount,
      yoyChange: borrowYoyChange,
      momChange: borrowMomChange,
      isAnomaly: Math.abs(borrowYoyChange) > 20,
      trend: borrowTrend.reverse().map(t => ({ week: t.week, value: t.value })),
    },
    renewalRate: {
      value: renewalRate,
      yoyChange: renewalYoyChange,
      momChange: renewalMomChange,
      isAnomaly: Math.abs(renewalYoyChange) > 20,
      trend: renewalTrend.reverse().map(t => ({ week: t.week, value: t.total > 0 ? parseFloat(((t.renewed / t.total) * 100).toFixed(1)) : 0 })),
    },
    reservationFulfillRate: {
      value: fulfillRate,
      yoyChange: fulfillYoyChange,
      momChange: calcChange(fulfillRate, 0),
      isAnomaly: Math.abs(fulfillYoyChange) > 20,
      trend: fulfillTrend.reverse().map(t => ({ week: t.week, value: t.total > 0 ? parseFloat(((t.fulfilled / t.total) * 100).toFixed(1)) : 0 })),
    },
    overdueRate: {
      value: overdueRate,
      yoyChange: overdueYoyChange,
      momChange: overdueMomChange,
      isAnomaly: Math.abs(overdueYoyChange) > 20,
      trend: overdueTrend.reverse().map(t => ({ week: t.week, value: t.total > 0 ? parseFloat(((t.overdue / t.total) * 100).toFixed(1)) : 0 })),
    },
  }

  const updatedAtRow = db.prepare('SELECT MAX(updated_at) as updated_at FROM update_log').get() as { updated_at: string | null }
  const meta: MetaInfo = {
    updatedAt: updatedAtRow.updated_at ?? new Date().toISOString(),
    cacheHit: false,
    filterSnapshot: filter,
    childDataAggregated: true,
  }

  setCache(cacheKey, { data, meta })
  res.json({ success: true, data, meta })
})

export default router
