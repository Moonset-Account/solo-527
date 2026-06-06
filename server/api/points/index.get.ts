import Point from '~/server/models/Point'
import { requireAuth } from '~/server/utils/auth'

export default requireAuth(async (event) => {
  const query = getQuery(event)
  const { community, status, page = 1, limit = 50 } = query
  
  const filter: any = {}
  if (community) filter.community = community
  if (status) filter.status = status
  
  const points = await Point.find(filter)
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
  
  const total = await Point.countDocuments(filter)
  
  return {
    points,
    total,
    page: Number(page),
    limit: Number(limit)
  }
})
