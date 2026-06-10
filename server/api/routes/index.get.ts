import { requireAuth } from '~/server/utils/response'
import { successResponse, paginate } from '~/server/utils/response'
import { usePrisma } from '~/server/plugins/prisma'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const { orderId } = getQuery(event)
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 20

  const prisma = usePrisma()

  const where: any = {}

  if (orderId) {
    where.orderId = BigInt(orderId)
  }

  const [total, list] = await Promise.all([
    prisma.routePlan.count({ where }),
    prisma.routePlan.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { username: true, realName: true } },
        order: { select: { orderNo: true } },
      },
    }),
  ])

  return successResponse(paginate(total, list, page, pageSize))
})
