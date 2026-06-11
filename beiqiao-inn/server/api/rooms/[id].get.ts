import { prisma } from '~/server/utils/prisma'
import { useMockStore, isDbAvailable } from '~/server/utils/mockData'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'invalid room id' })
  }

  if (!(await isDbAvailable())) {
    const store = useMockStore()
    const room = store.rooms.find(r => r.id === id)
    if (!room) {
      throw createError({ statusCode: 404, statusMessage: 'room not found' })
    }
    return room
  }

  const room = await prisma.room.findUnique({
    where: { id },
    include: { inventories: { orderBy: { date: 'asc' } } },
  })

  if (!room) {
    throw createError({ statusCode: 404, statusMessage: 'room not found' })
  }

  return room
})
