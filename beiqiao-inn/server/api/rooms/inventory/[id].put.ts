import { prisma } from '~/server/utils/prisma'
import { invalidateCache } from '~/server/utils/redis'
import { isDbAvailable } from '~/server/utils/mockData'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'invalid inventory id' })
  }

  const body = await readBody(event)
  const { availableCount, price, syncStatus } = body

  if (!(await isDbAvailable())) {
    return { id, availableCount, price, syncStatus, updatedAt: new Date() }
  }

  const data: Record<string, unknown> = {}
  if (availableCount !== undefined) data.availableCount = availableCount
  if (price !== undefined) data.price = price
  if (syncStatus !== undefined) data.syncStatus = syncStatus

  const inventory = await prisma.roomInventory.update({
    where: { id },
    data,
  })

  await invalidateCache('rooms:inventory:*')
  await invalidateCache('rooms:list:*')

  return inventory
})
