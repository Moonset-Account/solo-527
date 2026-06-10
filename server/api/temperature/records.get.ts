import { requireAuth } from '~/server/utils/response'
import { successResponse, paginate } from '~/server/utils/response'
import { usePrisma } from '~/server/plugins/prisma'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const query = getQuery(event)
  const orderId = query.orderId as string
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 20
  const isAlert = query.isAlert as string

  const prisma = usePrisma()

  const where: any = {}

  if (orderId) {
    where.orderId = BigInt(orderId)
  }

  if (isAlert === 'true') {
    where.isAlert = true
  }

  const [total, list] = await Promise.all([
    prisma.temperatureRecord.count({ where }),
    prisma.temperatureRecord.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { collectedAt: 'desc' },
      include: {
        alerts: true,
      },
    }),
  ])

  return successResponse(paginate(total, list, page, pageSize))
})
