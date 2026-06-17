import { prisma } from '../../utils/db'
import { getUserSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session || !session.user) {
    throw createError({ statusCode: 401, message: '未登录' })
  }

  const query = getQuery(event)
  const {
    page = 1,
    pageSize = 50,
    action,
    userId,
    contractId,
    dateFrom,
    dateTo
  } = query

  const where: any = {}
  if (action && action !== 'ALL') where.action = action
  if (userId) where.userId = String(userId)
  if (contractId) where.contractId = String(contractId)
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) where.createdAt.gte = new Date(String(dateFrom))
    if (dateTo) where.createdAt.lte = new Date(String(dateTo))
  }

  const [logs, total] = await Promise.all([
    prisma.operationLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, role: true, avatar: true } },
        contract: { select: { id: true, contractNo: true, title: true } }
      },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.operationLog.count({ where })
  ])

  return { data: logs, total, page: Number(page), pageSize: Number(pageSize) }
})
