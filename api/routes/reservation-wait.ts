import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'
import { getCache, setCache } from '../cache.js'
import type { FilterState, ReservationWaitData, MetaInfo } from '../types.ts'

const router = Router()

function buildResWhere(filter: FilterState): { where: string; params: unknown[] } {
  const clauses: string[] = []
  const params: unknown[] = []

  clauses.push('rv.reserve_date >= ? AND rv.reserve_date <= ?')
  params.push(filter.dateRange.start, filter.dateRange.end)

  if (filter.branches.length > 0) {
    clauses.push(`rv.branch_id IN (${filter.branches.map(() => '?').join(',')})`)
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

router.post('/', (req: Request, res: Response): void => {
  const filter: FilterState = req.body?.filters ?? req.body
  const cacheKey = { route: 'reservation-wait', filters: filter }
  const cached = getCache<{ data: ReservationWaitData; meta: MetaInfo }>(cacheKey)
  if (cached) {
    res.json({ success: true, ...cached, meta: { ...cached.meta, cacheHit: true } })
    return
  }
  const db = getDb()

  const { where, params } = buildResWhere(filter)
  const baseJoin = `reservation rv JOIN book b ON rv.book_id = b.book_id JOIN reader r ON rv.reader_id = r.reader_id`

  const queueDepth = db.prepare(
    `SELECT
       b.title as bookTitle,
       COUNT(*) as queueSize
     FROM ${baseJoin}
     WHERE rv.status = 'waiting' AND ${where.replace('rv.reserve_date', 'rv.reserve_date')}
     GROUP BY rv.book_id, b.title
     ORDER BY queueSize DESC
     LIMIT 20`
  ).all(...params) as { bookTitle: string; queueSize: number }[]

  const queueWithUrgency: ReservationWaitData['queueDepth'] = queueDepth.map(q => ({
    bookTitle: q.bookTitle,
    queueSize: q.queueSize,
    urgency: q.queueSize >= 15 ? 'high' as const : q.queueSize >= 8 ? 'medium' as const : 'low' as const,
  }))

  const waitingReservations = db.prepare(
    `SELECT
       rv.book_id,
       rv.reserve_date,
       rv.fulfill_date,
       julianday(COALESCE(rv.fulfill_date, DATE('now'))) - julianday(rv.reserve_date) as waitDays
     FROM ${baseJoin}
     WHERE ${where}
     ORDER BY waitDays`
  ).all(...params) as { book_id: string; reserve_date: string; fulfill_date: string | null; waitDays: number }[]

  const waitBuckets: { range: string; count: number; median: number }[] = [
    { range: '0-3', count: 0, median: 0 },
    { range: '4-7', count: 0, median: 0 },
    { range: '8-14', count: 0, median: 0 },
    { range: '15-30', count: 0, median: 0 },
    { range: '31+', count: 0, median: 0 },
  ]

  const bucketValues: number[][] = [[], [], [], [], []]

  for (const res of waitingReservations) {
    const days = Math.max(0, Math.round(res.waitDays))
    if (days <= 3) { bucketValues[0].push(days); waitBuckets[0].count++ }
    else if (days <= 7) { bucketValues[1].push(days); waitBuckets[1].count++ }
    else if (days <= 14) { bucketValues[2].push(days); waitBuckets[2].count++ }
    else if (days <= 30) { bucketValues[3].push(days); waitBuckets[3].count++ }
    else { bucketValues[4].push(days); waitBuckets[4].count++ }
  }

  for (let i = 0; i < bucketValues.length; i++) {
    const arr = bucketValues[i].sort((a, b) => a - b)
    if (arr.length > 0) {
      const mid = Math.floor(arr.length / 2)
      waitBuckets[i].median = arr.length % 2 !== 0 ? arr[mid] : parseFloat(((arr[mid - 1] + arr[mid]) / 2).toFixed(1))
    }
  }

  const fulfillTrend = db.prepare(
    `SELECT
       strftime('%Y-W%W', rv.reserve_date) as week,
       COUNT(*) as total,
       SUM(CASE WHEN rv.status = 'fulfilled' THEN 1 ELSE 0 END) as fulfilled
     FROM ${baseJoin}
     WHERE ${where}
     GROUP BY week
     ORDER BY week DESC
     LIMIT 12`
  ).all(...params) as { week: string; total: number; fulfilled: number }[]

  const yoyStart = new Date(filter.dateRange.start)
  yoyStart.setFullYear(yoyStart.getFullYear() - 1)
  const yoyEnd = new Date(filter.dateRange.end)
  yoyEnd.setFullYear(yoyEnd.getFullYear() - 1)
  const yoyFilter: FilterState = { ...filter, dateRange: { start: yoyStart.toISOString().slice(0, 10), end: yoyEnd.toISOString().slice(0, 10) } }
  const { where: yoyWhere, params: yoyParams } = buildResWhere(yoyFilter)

  const yoyFulfillTotal = db.prepare(
    `SELECT COUNT(*) as total, SUM(CASE WHEN rv.status = 'fulfilled' THEN 1 ELSE 0 END) as fulfilled FROM ${baseJoin} WHERE ${yoyWhere}`
  ).get(...yoyParams) as { total: number; fulfilled: number }

  const yoyRate = yoyFulfillTotal.total > 0 ? (yoyFulfillTotal.fulfilled / yoyFulfillTotal.total) * 100 : 0
  const currentRate = fulfillTrend.reduce((acc, t) => acc + t.total, 0) > 0
    ? (fulfillTrend.reduce((acc, t) => acc + t.fulfilled, 0) / fulfillTrend.reduce((acc, t) => acc + t.total, 0)) * 100
    : 0
  const yoyChange = yoyRate > 0 ? ((currentRate - yoyRate) / yoyRate) * 100 : 0

  const fulfillRateTrend: ReservationWaitData['fulfillRateTrend'] = fulfillTrend.reverse().map(t => ({
    week: t.week,
    rate: t.total > 0 ? parseFloat(((t.fulfilled / t.total) * 100).toFixed(1)) : 0,
    isAnomaly: Math.abs(yoyChange) > 20,
  }))

  const data: ReservationWaitData = {
    queueDepth: queueWithUrgency,
    waitDistribution: waitBuckets,
    fulfillRateTrend,
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
