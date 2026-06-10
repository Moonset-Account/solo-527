import { requireAuth } from '~/server/utils/response'
import { successResponse, paginate } from '~/server/utils/response'
import { usePrisma } from '~/server/plugins/prisma'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 20
  const customerId = query.customerId as string
  const status = query.status as string
  const startDate = query.startDate as string
  const endDate = query.endDate as string

  const prisma = usePrisma()

  const where: any = {}

  if (customerId) {
    where.customerId = BigInt(customerId)
  }

  if (status) {
    where.status = status
  }

  if (startDate || endDate) {
    where.reportDate = {}
    if (startDate) where.reportDate.gte = new Date(startDate)
    if (endDate) where.reportDate.lte = new Date(endDate)
  }

  const [total, list] = await Promise.all([
    prisma.temperatureSafetyReport.count({ where }),
    prisma.temperatureSafetyReport.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { reportDate: 'desc' },
      include: {
        customer: { select: { customerNo: true, companyName: true } },
        order: { select: { orderNo: true } },
        handler: { select: { username: true, realName: true } },
        confirmer: { select: { username: true, realName: true } },
      },
    }),
  ])

  return successResponse(paginate(total, list, page, pageSize))
})
