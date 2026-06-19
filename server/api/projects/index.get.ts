import { prisma } from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)

  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 10
  const status = query.status as string | undefined
  const keyword = query.keyword as string | undefined

  const where: any = {}

  if (user.role === 'owner') {
    where.ownerId = user.id
  }

  if (status) {
    where.status = status
  }

  if (keyword) {
    where.OR = [
      { name: { contains: keyword } },
      { owner: { name: { contains: keyword } } },
    ]
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        owner: { select: { name: true, phone: true } },
        attachments: { take: 3 },
        budgetVersions: {
          where: { status: 'confirmed' },
          orderBy: { version: 'desc' },
          take: 1,
        },
        inspections: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            rectifications: {
              where: { status: { not: 'completed' } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.project.count({ where }),
  ])

  const now = new Date()
  const data = projects.map(project => ({
    id: project.id,
    name: project.name,
    ownerId: project.ownerId,
    ownerName: project.owner.name,
    status: project.status,
    currentBudgetVersionId: project.budgetVersions[0]?.id || null,
    currentBudgetVersion: project.budgetVersions[0] ? {
      id: project.budgetVersions[0].id,
      version: project.budgetVersions[0].version,
      totalAmount: Number(project.budgetVersions[0].totalAmount),
    } : null,
    startDate: project.startDate,
    endDate: project.endDate,
    description: project.description,
    attachments: project.attachments,
    inspectionCount: project.inspections.length,
    latestInspection: project.inspections[0] || null,
    isDelayed: project.endDate ? new Date(project.endDate) < now && project.status !== 'completed' : false,
    pendingRectificationCount: project.inspections[0]?.rectifications.length || 0,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  }))

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
})
