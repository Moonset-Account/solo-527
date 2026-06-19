import { prisma } from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/auth'
import { redis } from '~/server/utils/redis'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['manager'])
  const projectId = getRouterParam(event, 'id')
  const body = await readBody(event)

  const { items, changeReason, status } = body

  const lastVersion = await prisma.budgetVersion.findFirst({
    where: { projectId },
    orderBy: { version: 'desc' },
    select: { version: true, totalAmount: true },
  })

  const newVersion = (lastVersion?.version || 0) + 1
  const totalAmount = items.reduce((sum: number, item: any) => sum + Number(item.amount || item.quantity * item.unitPrice), 0)
  const changeAmount = lastVersion ? totalAmount - Number(lastVersion.totalAmount) : totalAmount

  const budgetVersion = await prisma.budgetVersion.create({
    data: {
      projectId,
      version: newVersion,
      totalAmount,
      changeAmount,
      changeReason: changeReason || null,
      status: status || 'draft',
      createdBy: user.id,
      items: {
        create: items.map((item: any) => ({
          name: item.name,
          category: item.category || '其他',
          unit: item.unit || '项',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount || item.quantity * item.unitPrice,
          remark: item.remark || null,
        })),
      },
      snapshot: { items, createdAt: new Date().toISOString() },
    },
    include: {
      items: true,
      creator: { select: { name: true } },
    },
  })

  if (status === 'pending_confirm' || changeAmount !== 0) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true, ownerId: true },
    })

    if (project) {
      await prisma.notification.create({
        data: {
          userId: project.ownerId,
          type: 'budget_change',
          title: '预算变更待确认',
          content: `项目「${project.name}」的第 ${newVersion} 版预算已提交，${changeAmount >= 0 ? '增加' : '减少'} ${Math.abs(changeAmount).toFixed(2)} 元，请及时确认。`,
          relatedId: budgetVersion.id,
        },
      })

      const csUsers = await prisma.user.findMany({
        where: { role: 'customer_service' },
        select: { id: true },
      })

      for (const cs of csUsers) {
        await prisma.notification.create({
          data: {
            userId: cs.id,
            type: 'budget_change',
            title: '预算变更通知',
            content: `项目「${project.name}」提交了第 ${newVersion} 版预算，${changeAmount >= 0 ? '增加' : '减少'} ${Math.abs(changeAmount).toFixed(2)} 元，请跟进。`,
            relatedId: budgetVersion.id,
          },
        })
      }
    }
  }

  await redis.del(`project:${projectId}`)

  return {
    ...budgetVersion,
    totalAmount: Number(budgetVersion.totalAmount),
    changeAmount: Number(budgetVersion.changeAmount),
    items: budgetVersion.items.map(item => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      amount: Number(item.amount),
    })),
    creatorName: budgetVersion.creator.name,
  }
})
