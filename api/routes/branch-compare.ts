import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'
import { getCache, setCache } from '../cache.js'
import type { FilterState, BranchCompareData, MetaInfo } from '../types.ts'

const router = Router()

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

router.post('/', (req: Request, res: Response): void => {
  const filter: FilterState = req.body?.filters ?? req.body
  const cacheKey = { route: 'branch-compare', filters: filter }
  const cached = getCache<{ data: BranchCompareData; meta: MetaInfo }>(cacheKey)
  if (cached) {
    res.json({ success: true, ...cached, meta: { ...cached.meta, cacheHit: true } })
    return
  }
  const db = getDb()

  const { where, params } = buildWhere(filter)
  const baseJoin = `borrow_record br JOIN reader r ON br.reader_id = r.reader_id JOIN book b ON br.book_id = b.book_id JOIN branch bh ON br.branch_id = bh.branch_id`

  const branchStats = db.prepare(
    `SELECT
       bh.branch_id as id,
       bh.branch_name as name,
       COUNT(*) as borrowCount,
       ROUND(AVG(CASE WHEN br.is_renewed = 1 THEN 100.0 ELSE 0.0 END), 1) as renewalRate,
       ROUND(AVG(CASE WHEN br.is_overdue = 1 THEN 100.0 ELSE 0.0 END), 1) as overdueRate,
       0 as reservationRate,
       0 as utilizationRate
     FROM ${baseJoin}
     WHERE ${where}
     GROUP BY bh.branch_id, bh.branch_name
     ORDER BY borrowCount DESC`
  ).all(...params) as { id: string; name: string; borrowCount: number; renewalRate: number; overdueRate: number; reservationRate: number; utilizationRate: number }[]

  const branchIds = branchStats.map(b => b.id)

  const reservationBranchClauses: string[] = [
    'rv.reserve_date >= ? AND rv.reserve_date <= ?',
  ]
  const resParams: unknown[] = [filter.dateRange.start, filter.dateRange.end]

  if (filter.branches.length > 0) {
    reservationBranchClauses.push(`rv.branch_id IN (${filter.branches.map(() => '?').join(',')})`)
    resParams.push(...filter.branches)
  }

  const resWhere = reservationBranchClauses.join(' AND ')

  const reservationByBranch = db.prepare(
    `SELECT
       rv.branch_id,
       COUNT(*) as total,
       SUM(CASE WHEN rv.status = 'fulfilled' THEN 1 ELSE 0 END) as fulfilled
     FROM reservation rv
     WHERE ${resWhere}
     GROUP BY rv.branch_id`
  ).all(...resParams) as { branch_id: string; total: number; fulfilled: number }[]

  const resMap = new Map(reservationByBranch.map(r => [r.branch_id, r]))

  for (const branch of branchStats) {
    const resData = resMap.get(branch.id)
    branch.reservationRate = resData && resData.total > 0
      ? parseFloat(((resData.fulfilled / resData.total) * 100).toFixed(1))
      : 0
  }

  const bookStatsByBranch = db.prepare(
    `SELECT b.branch_id, SUM(b.total_copies) as totalCopies, SUM(b.total_copies - b.available_copies) as borrowed
     FROM book b
     WHERE 1=1 ${branchIds.length > 0 ? `AND b.branch_id IN (${branchIds.map(() => '?').join(',')})` : ''}
     GROUP BY b.branch_id`
  ).all(...branchIds) as { branch_id: string; totalCopies: number; borrowed: number }[]

  const bookMap = new Map(bookStatsByBranch.map(b => [b.branch_id, b]))
  for (const branch of branchStats) {
    const bookData = bookMap.get(branch.id)
    branch.utilizationRate = bookData && bookData.totalCopies > 0
      ? parseFloat(((bookData.borrowed / bookData.totalCopies) * 100).toFixed(1))
      : 0
  }

  const monthlyByBranch = db.prepare(
    `SELECT
       strftime('%Y-%m', br.borrow_date) as month,
       bh.branch_name as branchName,
       COUNT(*) as count
     FROM ${baseJoin}
     WHERE ${where}
     GROUP BY month, bh.branch_name
     ORDER BY month, branchName`
  ).all(...params) as { month: string; branchName: string; count: number }[]

  const monthMap = new Map<string, Record<string, number | string>>()
  for (const row of monthlyByBranch) {
    if (!monthMap.has(row.month)) {
      monthMap.set(row.month, { month: row.month })
    }
    monthMap.get(row.month)![row.branchName] = row.count
  }

  const monthlyData: BranchCompareData['monthlyData'] = Array.from(monthMap.values()) as BranchCompareData['monthlyData']

  const data: BranchCompareData = { branches: branchStats, monthlyData }

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
