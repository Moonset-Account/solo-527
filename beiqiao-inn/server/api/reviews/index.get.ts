import { prisma } from '~/server/utils/prisma'
import { mockReviews, isDbAvailable } from '~/server/utils/mockData'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const where: any = {}
  if (query.roomId) where.roomId = Number(query.roomId)
  if (query.status) where.status = query.status
  if (query.rating) where.rating = Number(query.rating)

  if (!(await isDbAvailable())) {
    let filtered = [...mockReviews]
    if (where.roomId) filtered = filtered.filter(r => r.roomId === where.roomId)
    if (where.status) filtered = filtered.filter(r => r.status === where.status)
    if (where.rating) filtered = filtered.filter(r => r.rating === where.rating)
    return filtered
  }

  const reviews = await prisma.review.findMany({
    where,
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  })
  return reviews
})
