import { requireAuth } from '~/server/utils/response'
import { successResponse, paginate } from '~/server/utils/response'
import { usePrisma } from '~/server/plugins/prisma'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const { id } = getRouterParams(event)
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 20

  const prisma = usePrisma()

  const where = { orderId: BigInt(id) }

  const [total, list] = await Promise.all([
    prisma.orderTimeline.count({ where }),
    prisma.orderTimeline.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { username: true, realName: true } },
        rider: { select: { riderNo: true, realName: true } },
      },
    }),
  ])

  return successResponse(paginate(total, list, page, pageSize))
})
