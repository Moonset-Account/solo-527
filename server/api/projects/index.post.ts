import { prisma } from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['manager'])
  const body = await readBody(event)

  const { name, ownerId, startDate, endDate, description } = body

  if (!name || !ownerId) {
    throw createError({
      statusCode: 400,
      statusMessage: '项目名称和业主不能为空',
    })
  }

  const project = await prisma.project.create({
    data: {
      name,
      ownerId,
      status: 'draft',
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      description,
    },
    include: {
      owner: { select: { name: true } },
    },
  })

  return {
    id: project.id,
    name: project.name,
    ownerId: project.ownerId,
    ownerName: project.owner.name,
    status: project.status,
    startDate: project.startDate,
    endDate: project.endDate,
    description: project.description,
    createdAt: project.createdAt,
  }
})
