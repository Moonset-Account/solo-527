import { prisma } from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const projectId = getRouterParam(event, 'id')

  const inspections = await prisma.inspection.findMany({
    where: { projectId },
    include: {
      inspector: { select: { name: true } },
      photos: { take: 6 },
      rectifications: true,
      feedback: {
        include: {
          confirmer: { select: { name: true } },
        },
      },
    },
    orderBy: { scheduledAt: 'desc' },
  })

  return inspections.map(ins => ({
    ...ins,
    inspectorName: ins.inspector.name,
    photos: ins.photos,
    rectifications: ins.rectifications,
    feedback: ins.feedback ? {
      ...ins.feedback,
      confirmerName: ins.feedback.confirmer.name,
    } : null,
  }))
})
