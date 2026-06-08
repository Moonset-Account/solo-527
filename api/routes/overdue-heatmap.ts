import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'
import { getCache, setCache } from '../cache.js'
import type { FilterState, OverdueHeatmapData, MetaInfo } from '../types.ts'

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
  const cacheKey = { route: 'overdue-heatmap', filters: filter }
  const cached = getCache<{ data: OverdueHeatmapData; meta: MetaInfo }>(cacheKey)
  if (cached) {
    res.json({ success: true, ...cached, meta: { ...cached.meta, cacheHit: true } })
    return
  }
  const db = getDb()

  const { where, params } = buildWhere(filter)
  const baseJoin = `borrow_record br JOIN reader r ON br.reader_id = r.reader_id JOIN book b ON br.book_id = b.book_id`

  const matrix = db.prepare(
    `SELECT
       b.theme_category as theme,
       r.age_group as ageGroup,
       COUNT(*) as count,
       SUM(CASE WHEN br.is_overdue = 1 THEN 1 ELSE 0 END) as overdueCount
     FROM ${baseJoin}
     WHERE ${where}
     GROUP BY b.theme_category, r.age_group
     HAVING count >= 5
     ORDER BY theme, ageGroup`
  ).all(...params) as { theme: string; ageGroup: string; count: number; overdueCount: number }[]

  const matrixData: OverdueHeatmapData['matrix'] = matrix.map(m => ({
    theme: m.theme,
    ageGroup: m.ageGroup,
    rate: m.count > 0 ? parseFloat(((m.overdueCount / m.count) * 100).toFixed(1)) : 0,
    count: m.count,
  }))

  const childProtected = filter.readerGroups.length === 0 || filter.readerGroups.includes('child')

  const readerProfile = db.prepare(
    `SELECT
       r.age_group as ageGroup,
       COUNT(*) as count,
       ROUND(COUNT(*) * 1.0 / COUNT(DISTINCT r.reader_id), 1) as avgBorrowFreq
     FROM ${baseJoin}
     WHERE ${where}
     GROUP BY r.age_group
     HAVING count >= 5
     ORDER BY ageGroup`
  ).all(...params) as { ageGroup: string; count: number; avgBorrowFreq: number }[]

  const readerProfileData: OverdueHeatmapData['readerProfile'] = readerProfile.map(rp => ({
    ageGroup: rp.ageGroup,
    count: rp.count,
    avgBorrowFreq: rp.avgBorrowFreq,
    isChildAggregated: rp.ageGroup === 'child' && childProtected,
  }))

  const themeCluster = db.prepare(
    `SELECT
       b.theme_category as theme,
       SUM(CASE WHEN br.is_overdue = 1 THEN 1 ELSE 0 END) as overdueCount,
       COUNT(*) as total
     FROM ${baseJoin}
     WHERE ${where}
     GROUP BY b.theme_category
     ORDER BY overdueCount DESC`
  ).all(...params) as { theme: string; overdueCount: number; total: number }[]

  const themeClusterData: OverdueHeatmapData['themeCluster'] = themeCluster.map(tc => ({
    theme: tc.theme,
    overdueCount: tc.overdueCount,
    overdueRate: tc.total > 0 ? parseFloat(((tc.overdueCount / tc.total) * 100).toFixed(1)) : 0,
  }))

  const data: OverdueHeatmapData = {
    matrix: matrixData,
    readerProfile: readerProfileData,
    themeCluster: themeClusterData,
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
