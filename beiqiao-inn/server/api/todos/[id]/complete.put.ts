import { prisma } from '~/server/utils/prisma'
import { invalidateCache } from '~/server/utils/redis'
import { useMockStore, isDbAvailable } from '~/server/utils/mockData'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!(await isDbAvailable())) {
    const store = useMockStore()
    return store.completeTodo(id)
  }

  const todo = await prisma.todoItem.findUnique({ where: { id } })
  if (!todo) {
    throw createError({ statusCode: 404, message: 'Todo not found' })
  }

  const updated = await prisma.todoItem.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
    },
    include: { assignee: true },
  })

  let vacancyUpdated = false

  if (todo.type === 'CLEANING') {
    const room = await prisma.room.findUnique({
      where: { id: todo.relatedId },
    })

    if (room) {
      await prisma.room.update({
        where: { id: room.id },
        data: { status: 'AVAILABLE' },
      })

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const inventories = await prisma.roomInventory.findMany({
        where: {
          roomId: room.id,
          date: { gte: today },
        },
      })

      for (const inv of inventories) {
        const activeOrderCount = await prisma.order.count({
          where: {
            roomId: room.id,
            status: { notIn: ['CANCELLED', 'REFUNDED', 'REFUNDING'] },
            checkIn: { lte: inv.date },
            checkOut: { gt: inv.date },
          },
        })

        const newAvailableCount = inv.totalCount - activeOrderCount
        if (inv.availableCount !== newAvailableCount) {
          await prisma.roomInventory.update({
            where: { id: inv.id },
            data: { availableCount: newAvailableCount },
          })
          vacancyUpdated = true
        }
      }

      await invalidateCache('api:rooms:*')
      await invalidateCache('api:dashboard:*')
    }
  }

  await invalidateCache('api:todos:*')

  return { todo: updated, vacancyUpdated }
})
