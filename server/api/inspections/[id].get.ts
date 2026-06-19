import { prisma } from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const id = getRouterParam(event, 'id')

  const inspection = await prisma.inspection.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true, ownerId: true } },
      inspector: { select: { id: true, name: true, phone: true } },
      photos: { orderBy: { uploadedAt: 'desc' } },
      rectifications: {
        include: {
          rectificationPhotos: { orderBy: { uploadedAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
      },
      feedback: {
        include: {
          confirmer: { select: { name: true } },
        },
      },
      budgetVersion: {
        select: { id: true, version: true, totalAmount: true },
      },
    },
  })

  if (!inspection) {
    throw createError({
      statusCode: 404,
      statusMessage: '巡检记录不存在',
    })
  }

  return {
    ...inspection,
    projectName: inspection.project.name,
    inspectorName: inspection.inspector.name,
    photos: inspection.photos,
    rectifications: inspection.rectifications.map(r => ({
      ...r,
      photos: r.rectificationPhotos?.map(p => p.url) || [],
    })),
    feedback: inspection.feedback ? {
      ...inspection.feedback,
      confirmerName: inspection.feedback.confirmer.name,
    } : null,
    budgetVersion: inspection.budgetVersion ? {
      ...inspection.budgetVersion,
      totalAmount: Number(inspection.budgetVersion.totalAmount),
    } : null,
  }
})
