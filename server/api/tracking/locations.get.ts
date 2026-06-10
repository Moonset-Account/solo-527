import { requireAuth } from '~/server/utils/response'
import { successResponse, paginate } from '~/server/utils/response'
import { usePrisma } from '~/server/plugins/prisma'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const query = getQuery(event)
  const riderId = query.riderId as string
  const orderId = query.orderId as string
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 50
  const startTime = query.startTime as string
  const endTime = query.endTime as string

  const prisma = usePrisma()

  const where: any = {}

  if (riderId) {
    where.riderId = BigInt(riderId)
  }

  if (orderId) {
    where.orderId = BigInt(orderId)
  }

  if (startTime || endTime) {
    where.collectedAt = {}
    if (startTime) where.collectedAt.gte = new Date(startTime)
    if (endTime) where.collectedAt.lte = new Date(endTime)
  }

  const [total, list] = await Promise.all([
    prisma.riderLocation.count({ where }),
    prisma.riderLocation.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { collectedAt: 'asc' },
    }),
  ])

  return successResponse(paginate(total, list, page, pageSize))
})
