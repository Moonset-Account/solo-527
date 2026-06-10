import { requireAuth } from '~/server/utils/response'
import { successResponse, paginate } from '~/server/utils/response'
import { usePrisma } from '~/server/plugins/prisma'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 20
  const status = query.status as string

  const prisma = usePrisma()

  const where: any = {}

  if (status) {
    where.status = status
  } else {
    where.status = { in: ['ACCEPTED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED'] }
  }

  const [total, list] = await Promise.all([
    prisma.deliveryOrder.count({ where }),
    prisma.deliveryOrder.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { priority: 'desc', createdAt: 'desc' },
      include: {
        customer: { select: { customerNo: true, companyName: true } },
        rider: { select: { riderNo: true, realName: true, phone: true, status: true, currentLng: true, currentLat: true } },
        dispatcher: { select: { username: true, realName: true } },
      },
    }),
  ])

  return successResponse(paginate(total, list, page, pageSize))
})
