import { prisma, generateContractNo } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session || !session.user) {
    throw createError({ statusCode: 401, message: '未登录' })
  }

  const query = getQuery(event)
  const {
    page = 1,
    pageSize = 20,
    status,
    contractType,
    keyword,
    priority,
    dateFrom,
    dateTo,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = query

  const where: any = {}

  if (status && status !== 'ALL') {
    where.status = status
  }
  if (contractType && contractType !== 'ALL') {
    where.contractType = contractType
  }
  if (priority && priority !== 'ALL') {
    where.priority = priority
  }
  if (keyword) {
    where.OR = [
      { title: { contains: String(keyword) } },
      { contractNo: { contains: String(keyword) } },
      { partyA: { contains: String(keyword) } },
      { partyB: { contains: String(keyword) } },
      { keywords: { contains: String(keyword) } }
    ]
  }
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) where.createdAt.gte = new Date(String(dateFrom))
    if (dateTo) where.createdAt.lte = new Date(String(dateTo))
  }

  const [contracts, total] = await Promise.all([
    prisma.contract.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true, role: true } },
        assignments: {
          include: {
            lawyer: { select: { id: true, name: true, role: true } },
            reviewer: { select: { id: true, name: true, role: true } }
          },
          take: 1,
          orderBy: { createdAt: 'desc' }
        },
        versions: {
          select: { id: true, versionNo: true, fileName: true, isCurrent: true },
          where: { isCurrent: true },
          take: 1
        },
        _count: {
          select: { opinions: true, downloads: true }
        }
      },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
      orderBy: { [String(sortBy)]: sortOrder as 'asc' | 'desc' }
    }),
    prisma.contract.count({ where })
  ])

  return {
    data: contracts,
    total,
    page: Number(page),
    pageSize: Number(pageSize),
    totalPages: Math.ceil(total / Number(pageSize))
  }
})
