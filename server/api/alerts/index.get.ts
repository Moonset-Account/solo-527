import { requireAuth } from '~/server/utils/response'
import { successResponse, paginate } from '~/server/utils/response'
import { usePrisma } from '~/server/plugins/prisma'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const query = getQuery(event)
  const orderId = query.orderId as string
  const status = query.status as string
  const alertLevel = query.alertLevel as string
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 20

  const prisma = usePrisma()

  const where: any = {}

  if (orderId) {
    where.orderId = BigInt(orderId)
  }

  if (status) {
    where.status = status
  }

  if (alertLevel) {
    where.alertLevel = alertLevel
  }

  const [total, list] = await Promise.all([
    prisma.temperatureAlert.count({ where }),
    prisma.temperatureAlert.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        order: { select: { orderNo: true } },
        ackUser: { select: { username: true, realName: true } },
        resUser: { select: { username: true, realName: true } },
      },
    }),
  ])

  return successResponse(paginate(total, list, page, pageSize))
})
