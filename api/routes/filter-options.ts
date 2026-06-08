import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'
import type { FilterOptions, MetaInfo } from '../types.ts'

const router = Router()

router.get('/', (_req: Request, res: Response): void => {
  const db = getDb()

  const collectionTypes = db.prepare(
    `SELECT DISTINCT collection_type FROM book ORDER BY collection_type`
  ).all() as { collection_type: string }[]

  const readerGroups: { key: string; label: string; aggregationOnly: boolean }[] = [
    { key: 'child', label: '少儿', aggregationOnly: true },
    { key: 'youth', label: '青年', aggregationOnly: false },
    { key: 'middle', label: '中年', aggregationOnly: false },
    { key: 'senior', label: '老年', aggregationOnly: false },
  ]

  const themes = db.prepare(
    `SELECT DISTINCT theme_category FROM book ORDER BY theme_category`
  ).all() as { theme_category: string }[]

  const branches = db.prepare(
    `SELECT branch_id as id, branch_name as name FROM branch ORDER BY branch_id`
  ).all() as { id: string; name: string }[]

  const data: FilterOptions = {
    collectionTypes: collectionTypes.map(c => c.collection_type),
    readerGroups,
    themes: themes.map(t => t.theme_category),
    branches,
  }

  const updatedAtRow = db.prepare('SELECT MAX(updated_at) as updated_at FROM update_log').get() as { updated_at: string | null }
  const meta: MetaInfo = {
    updatedAt: updatedAtRow.updated_at ?? new Date().toISOString(),
    cacheHit: false,
    filterSnapshot: { collectionTypes: [], readerGroups: [], themes: [], branches: [], dateRange: { start: '', end: '' } },
    childDataAggregated: true,
  }

  res.json({ success: true, data, meta })
})

export default router
