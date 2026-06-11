import { prisma } from '~/server/utils/prisma'
import { useMockStore, isDbAvailable } from '~/server/utils/mockData'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 20
  const where: any = {}

  if (query.status) {
    where.status = query.status
  }

  if (query.userId) {
    where.userId = Number(query.userId)
  }

  if (query.startDate || query.endDate) {
    where.createdAt = {}
    if (query.startDate) {
      where.createdAt.gte = new Date(query.startDate as string)
    }
    if (query.endDate) {
      where.createdAt.lte = new Date(query.endDate as string)
    }
  }

  if (!(await isDbAvailable())) {
    const store = useMockStore()
    let filtered = [...store.orders]
    if (where.status) filtered = filtered.filter(o => o.status === where.status)
    if (where.userId) filtered = filtered.filter(o => o.userId === where.userId)
    const total = filtered.length
    const data = filtered.slice((page - 1) * pageSize, page * pageSize)
    return {
      data,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    }
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { user: true, room: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where }),
  ])

  return {
    data: orders,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  }
})
