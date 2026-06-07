import { Router, type Request, type Response } from 'express'
import { queryDetail } from '../services/aggregation.js'
import { caliberDefinitions } from '../data/mockData.js'
import type { DetailQuery } from '../../shared/types.js'

const router = Router()

router.post('/', (req: Request, res: Response) => {
  const query: DetailQuery = req.body
  try {
    const { records, total } = queryDetail(
      query.filters,
      query.page,
      query.pageSize,
      query.sortBy,
      query.sortOrder
    )
    const caliberNote = '所有学生信息已脱敏处理，仅展示匿名ID。等待天数 = 预约创建日至首次咨询日的自然日数。'
    res.json({ records, total, page: query.page, caliberNote })
  } catch (err) {
    res.status(500).json({ error: '明细查询失败' })
  }
})

export default router
