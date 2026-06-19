import { prisma } from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'
import { redis } from '~/server/utils/redis'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')

  const version = await prisma.budgetVersion.findUnique({
    where: { id },
    include: { project: { select: { ownerId: true, name: true } } },
  })

  if (!version) {
    throw createError({
      statusCode: 404,
      statusMessage: '预算版本不存在',
    })
  }

  if (user.role !== 'owner' && user.role !== 'manager') {
    throw createError({
      statusCode: 403,
      statusMessage: '无权确认预算',
    })
  }

  if (user.role === 'owner' && version.project.ownerId !== user.id) {
    throw createError({
      statusCode: 403,
      statusMessage: '无权确认该项目预算',
    })
  }

  const updated = await prisma.budgetVersion.update({
    where: { id },
    data: {
      status: 'confirmed',
      confirmedAt: new Date(),
      confirmedBy: user.id,
    },
    include: {
      creator: { select: { name: true } },
      confirmer: { select: { name: true } },
      items: true,
    },
  })

  await prisma.project.update({
    where: { id: version.projectId },
    data: { currentBudgetVersionId: id },
  })

  await redis.del(`project:${version.projectId}`)
  await redis.del(`budget:${id}`)

  return {
    ...updated,
    totalAmount: Number(updated.totalAmount),
    changeAmount: Number(updated.changeAmount),
    items: updated.items.map(item => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      amount: Number(item.amount),
    })),
    creatorName: updated.creator.name,
    confirmerName: updated.confirmer?.name || null,
  }
})
