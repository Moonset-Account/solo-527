import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { interviewId, page = 1, pageSize = 50 } = query

  const where: any = {}
  if (interviewId) where.interviewId = Number(interviewId)

  const [logs, total] = await Promise.all([
    prisma.apiRetryLog.findMany({
      where,
      include: {
        interview: {
          select: {
            id: true,
            title: true,
            candidate: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize)
    }),
    prisma.apiRetryLog.count({ where })
  ])

  return {
    data: logs,
    total,
    page: Number(page),
    pageSize: Number(pageSize)
  }
})
