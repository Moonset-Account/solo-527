import { requireAuth } from '~/server/utils/response'
import { successResponse, paginate } from '~/server/utils/response'
import { usePrisma } from '~/server/plugins/prisma'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 10
  const keyword = query.keyword as string
  const status = query.status as string
  const orderType = query.orderType as string
  const priority = query.priority as string
  const customerId = query.customerId as string
  const riderId = query.riderId as string

  const prisma = usePrisma()

  const where: any = {}

  if (keyword) {
    where.OR = [
      { orderNo: { contains: keyword } },
      { sourceOrderNo: { contains: keyword } },
      { pickupAddress: { contains: keyword } },
      { deliveryAddress: { contains: keyword } },
    ]
  }

  if (status) {
    where.status = status
  }

  if (orderType) {
    where.orderType = orderType
  }

  if (priority) {
    where.priority = priority
  }

  if (customerId) {
    where.customerId = BigInt(customerId)
  }

  if (riderId) {
    where.riderId = BigInt(riderId)
  }

  const [total, list] = await Promise.all([
    prisma.deliveryOrder.count({ where }),
    prisma.deliveryOrder.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { customerNo: true, companyName: true } },
        rider: { select: { riderNo: true, realName: true, phone: true } },
        dispatcher: { select: { username: true, realName: true } },
      },
    }),
  ])

  return successResponse(paginate(total, list, page, pageSize))
})
