import { prisma } from '~/server/utils/prisma'
import { getCached } from '~/server/utils/redis'
import { mockRooms, generateMockInventories, isDbAvailable } from '~/server/utils/mockData'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const startDate = query.startDate as string | undefined
  const endDate = query.endDate as string | undefined
  const type = query.type as string | undefined
  const status = query.status as string | undefined

  if (!(await isDbAvailable())) {
    let inventories = generateMockInventories(mockRooms)
    if (type) inventories = inventories.filter(i => i.room.type === type)
    if (status) inventories = inventories.filter(i => i.syncStatus === status)
    if (startDate) inventories = inventories.filter(i => i.date >= startDate)
    if (endDate) inventories = inventories.filter(i => i.date <= endDate)
    return inventories
  }

  const cacheKey = `rooms:inventory:${startDate || ''}:${endDate || ''}:${type || ''}:${status || ''}`

  return getCached(cacheKey, async () => {
    const where: Record<string, unknown> = {}

    if (startDate || endDate) {
      where.date = {}
      if (startDate) (where.date as Record<string, unknown>).gte = new Date(startDate)
      if (endDate) (where.date as Record<string, unknown>).lte = new Date(endDate)
    }

    if (type) {
      where.room = { type }
    }

    if (status) {
      where.syncStatus = status
    }

    return prisma.roomInventory.findMany({
      where,
      include: { room: { select: { id: true, name: true, type: true } } },
      orderBy: { date: 'asc' },
    })
  }, 60)
})
