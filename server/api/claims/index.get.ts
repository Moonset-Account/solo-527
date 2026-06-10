import { requireAuth } from '~/server/utils/response'
import { successResponse, paginate } from '~/server/utils/response'
import { usePrisma } from '~/server/plugins/prisma'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const query = getQuery(event)
  const orderId = query.orderId as string
  const status = query.status as string
  const claimType = query.claimType as string
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

  if (claimType) {
    where.claimType = claimType
  }

  const [total, list] = await Promise.all([
    prisma.claimOrder.count({ where }),
    prisma.claimOrder.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        order: { select: { orderNo: true } },
        tempAlert: { select: { id: true, alertType: true, temperature: true } },
        applicant: { select: { username: true, realName: true } },
        reviewer: { select: { username: true, realName: true } },
        approver: { select: { username: true, realName: true } },
      },
    }),
  ])

  return successResponse(paginate(total, list, page, pageSize))
})
