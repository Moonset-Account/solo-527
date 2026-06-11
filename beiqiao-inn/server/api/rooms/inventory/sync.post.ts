import { prisma } from '~/server/utils/prisma'
import { invalidateCache } from '~/server/utils/redis'
import { isDbAvailable } from '~/server/utils/mockData'

export default defineEventHandler(async () => {
  if (!(await isDbAvailable())) {
    return { synced: 3 }
  }

  const pendingInventories = await prisma.roomInventory.findMany({
    where: { syncStatus: 'PENDING' },
  })

  if (pendingInventories.length === 0) {
    return { synced: 0 }
  }

  await prisma.roomInventory.updateMany({
    where: { syncStatus: 'PENDING' },
    data: { syncStatus: 'SYNCING' },
  })

  await new Promise((resolve) => setTimeout(resolve, 500))

  await prisma.roomInventory.updateMany({
    where: { syncStatus: 'SYNCING' },
    data: {
      syncStatus: 'SYNCED',
      lastSyncedAt: new Date(),
    },
  })

  await invalidateCache('rooms:inventory:*')
  await invalidateCache('rooms:list:*')

  return { synced: pendingInventories.length }
})
