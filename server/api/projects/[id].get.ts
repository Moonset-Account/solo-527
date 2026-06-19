import { prisma } from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, phone: true, email: true } },
      attachments: true,
      budgetVersions: {
        orderBy: { version: 'desc' },
        include: {
          items: true,
          creator: { select: { name: true } },
        },
      },
      inspections: {
        orderBy: { scheduledAt: 'desc' },
        include: {
          inspector: { select: { name: true } },
          photos: true,
          rectifications: true,
          feedback: {
            include: {
              confirmer: { select: { name: true } },
            },
          },
        },
      },
    },
  })

  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: '项目不存在',
    })
  }

  if (user.role === 'owner' && project.ownerId !== user.id) {
    throw createError({
      statusCode: 403,
      statusMessage: '无权访问该项目',
    })
  }

  const now = new Date()

  return {
    id: project.id,
    name: project.name,
    ownerId: project.ownerId,
    owner: project.owner,
    ownerName: project.owner.name,
    status: project.status,
    currentBudgetVersionId: project.budgetVersions.find(b => b.status === 'confirmed')?.id || null,
    startDate: project.startDate,
    endDate: project.endDate,
    description: project.description,
    attachments: project.attachments,
    budgetVersions: project.budgetVersions.map(bv => ({
      ...bv,
      totalAmount: Number(bv.totalAmount),
      changeAmount: Number(bv.changeAmount),
      items: bv.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        amount: Number(item.amount),
      })),
      creatorName: bv.creator.name,
    })),
    inspections: project.inspections.map(ins => ({
      ...ins,
      inspectorName: ins.inspector.name,
      photos: ins.photos,
      rectifications: ins.rectifications,
      feedback: ins.feedback ? {
        ...ins.feedback,
        confirmerName: ins.feedback.confirmer.name,
      } : null,
    })),
    isDelayed: project.endDate ? new Date(project.endDate) < now && project.status !== 'completed' : false,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  }
})
