import { prisma } from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const projectId = getRouterParam(event, 'id')

  const versions = await prisma.budgetVersion.findMany({
    where: { projectId },
    include: {
      items: true,
      creator: { select: { name: true } },
      confirmer: { select: { name: true } },
    },
    orderBy: { version: 'desc' },
  })

  return versions.map(v => ({
    ...v,
    totalAmount: Number(v.totalAmount),
    changeAmount: Number(v.changeAmount),
    items: v.items.map(item => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      amount: Number(item.amount),
    })),
    creatorName: v.creator.name,
    confirmerName: v.confirmer?.name || null,
  }))
})
