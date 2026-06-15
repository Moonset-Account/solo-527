import prisma from '~/server/utils/prisma'
import { verifyToken } from '~/server/utils/auth'
import { paginatedResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)

  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 20
  const status = query.status as string
  const type = query.type as string
  const keyword = query.keyword as string
  const assigneeId = query.assigneeId ? parseInt(query.assigneeId as string) : undefined

  const where: any = {}

  if (user.role === 'ENGINEER') {
    where.assigneeId = user.id
  }

  if (status && status !== 'all') {
    where.status = status
  }

  if (type && type !== 'all') {
    where.type = type
  }

  if (assigneeId) {
    where.assigneeId = assigneeId
  }

  if (keyword) {
    where.OR = [
      { taskNo: { contains: keyword } },
      { title: { contains: keyword } }
    ]
  }

  const [total, list] = await Promise.all([
    prisma.inspectionTask.count({ where }),
    prisma.inspectionTask.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true } }
      },
      orderBy: { planDate: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ])

  return paginatedResponse(list, total, page, pageSize)
})
