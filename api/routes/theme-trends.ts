import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'
import { getCache, setCache } from '../cache.js'
import type { FilterState, ThemeTrendData, MetaInfo } from '../types.ts'

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
  const cacheKey = { route: 'theme-trends', filters: filter }
  const cached = getCache<{ data: ThemeTrendData; meta: MetaInfo }>(cacheKey)
  if (cached) {
    res.json({ success: true, ...cached, meta: { ...cached.meta, cacheHit: true } })
    return
  }
  const db = getDb()

  const { where, params } = buildWhere(filter)
  const baseJoin = `borrow_record br JOIN reader r ON br.reader_id = r.reader_id JOIN book b ON br.book_id = b.book_id`

  const monthlyByTheme = db.prepare(
    `SELECT b.theme_category as theme, strftime('%Y-%m', br.borrow_date) as month, COUNT(*) as count
     FROM ${baseJoin}
     WHERE ${where}
     GROUP BY b.theme_category, month
     ORDER BY theme, month`
  ).all(...params) as { theme: string; month: string; count: number }[]

  const yoyStart = new Date(filter.dateRange.start)
  yoyStart.setFullYear(yoyStart.getFullYear() - 1)
  const yoyEnd = new Date(filter.dateRange.end)
  yoyEnd.setFullYear(yoyEnd.getFullYear() - 1)

  const yoyFilter: FilterState = {
    ...filter,
    dateRange: { start: yoyStart.toISOString().slice(0, 10), end: yoyEnd.toISOString().slice(0, 10) },
  }
  const { where: yoyWhere, params: yoyParams } = buildWhere(yoyFilter)

  const yoyMonthlyByTheme = db.prepare(
    `SELECT b.theme_category as theme, strftime('%Y-%m', br.borrow_date) as month, COUNT(*) as count
     FROM ${baseJoin}
     WHERE ${yoyWhere}
     GROUP BY b.theme_category, month
     ORDER BY theme, month`
  ).all(...yoyParams) as { theme: string; month: string; count: number }[]

  const yoyMap = new Map<string, number>()
  for (const row of yoyMonthlyByTheme) {
    const currentMonth = row.month.replace(/^\d{4}/, filter.dateRange.start.slice(0, 4))
    yoyMap.set(`${row.theme}:${currentMonth}`, row.count)
  }

  const themeMap = new Map<string, { month: string; count: number; yoyChange: number }[]>()
  for (const row of monthlyByTheme) {
    if (!themeMap.has(row.theme)) {
      themeMap.set(row.theme, [])
    }
    const yoyCount = yoyMap.get(`${row.theme}:${row.month}`) ?? 0
    const yoyChange = yoyCount > 0 ? parseFloat((((row.count - yoyCount) / yoyCount) * 100).toFixed(1)) : 0
    themeMap.get(row.theme)!.push({ month: row.month, count: row.count, yoyChange })
  }

  const themes: ThemeTrendData['themes'] = []
  for (const [name, data] of themeMap) {
    themes.push({ name, data })
  }

  const currentTotals = db.prepare(
    `SELECT b.theme_category as theme, COUNT(*) as total
     FROM ${baseJoin}
     WHERE ${where}
     GROUP BY b.theme_category
     ORDER BY total DESC`
  ).all(...params) as { theme: string; total: number }[]

  const previousTotals = db.prepare(
    `SELECT b.theme_category as theme, COUNT(*) as total
     FROM ${baseJoin}
     WHERE ${yoyWhere}
     GROUP BY b.theme_category
     ORDER BY total DESC`
  ).all(...yoyParams) as { theme: string; total: number }[]

  const rankings: ThemeTrendData['rankings'] = currentTotals.map((row, idx) => {
    const prevIdx = previousTotals.findIndex(p => p.theme === row.theme)
    const previousRank = prevIdx >= 0 ? prevIdx + 1 : currentTotals.length + 1
    return {
      theme: row.theme,
      currentRank: idx + 1,
      previousRank,
      change: previousRank - (idx + 1),
    }
  })

  const subThemeData = db.prepare(
    `SELECT b.theme_category as theme, b.sub_theme as sub, COUNT(*) as count
     FROM ${baseJoin}
     WHERE ${where}
     GROUP BY b.theme_category, b.sub_theme
     ORDER BY theme, count DESC`
  ).all(...params) as { theme: string; sub: string; count: number }[]

  const subThemeMap = new Map<string, { name: string; count: number }[]>()
  for (const row of subThemeData) {
    if (!subThemeMap.has(row.theme)) {
      subThemeMap.set(row.theme, [])
    }
    subThemeMap.get(row.theme)!.push({ name: row.sub, count: row.count })
  }

  const subThemes: ThemeTrendData['subThemes'] = []
  for (const [theme, subs] of subThemeMap) {
    subThemes.push({ theme, subs })
  }

  const data: ThemeTrendData = { themes, rankings, subThemes }

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
