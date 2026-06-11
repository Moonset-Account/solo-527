import { prisma } from '~/server/utils/prisma'
import { getCached } from '~/server/utils/redis'
import { mockRooms, isDbAvailable } from '~/server/utils/mockData'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const type = query.type as string | undefined
  const status = query.status as string | undefined

  if (!(await isDbAvailable())) {
    let result = mockRooms
    if (type) result = result.filter(r => r.type === type)
    if (status) result = result.filter(r => r.status === status)
    return result
  }

  const cacheKey = `rooms:list:${type || 'all'}:${status || 'all'}`

  return getCached(cacheKey, async () => {
    const where: Record<string, any> = {}
    if (type) where.type = type
    if (status) where.status = status

    return prisma.room.findMany({
      where,
      orderBy: { id: 'asc' },
    })
  }, 60)
})
