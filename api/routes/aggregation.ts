import { Router, type Request, type Response } from 'express'
import { aggregate, queryDetail } from '../services/aggregation.js'
import { caliberDefinitions } from '../data/mockData.js'
import type { AggregationQuery, DetailQuery } from '../../shared/types.js'

const router = Router()

router.post('/', (req: Request, res: Response) => {
  const query: AggregationQuery = req.body
  try {
    const data = aggregate(query.dimensions, query.metrics, query.timeRange, query.filters)
    const caliberNotes = caliberDefinitions
      .filter(c => query.metrics.includes(c.metricKey as any))
      .map(c => ({ metric: c.metricKey, definition: c.definition, formula: c.formula }))
    res.json({ data, caliberNotes })
  } catch (err) {
    res.status(500).json({ error: '聚合查询失败' })
  }
})

export default router
