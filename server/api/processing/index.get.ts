import { requireAuth } from '~/server/utils/response'
import { successResponse, paginate } from '~/server/utils/response'
import { usePrisma } from '~/server/plugins/prisma'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 20
  const bizType = query.bizType as string
  const status = query.status as string
  const handlerId = query.handlerId as string
  const keyword = query.keyword as string

  const prisma = usePrisma()

  const where: any = {}

  if (bizType) {
    const bizTypes = bizType.split(',')
    if (bizTypes.length > 1) {
      where.bizType = { in: bizTypes }
    } else {
      where.bizType = bizType
    }
  }

  if (status) {
    where.status = status
  }

  if (handlerId) {
    where.currentHandlerId = BigInt(handlerId)
  }

  const [total, list] = await Promise.all([
    prisma.processingView.count({ where }),
    prisma.processingView.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { updatedAt: 'desc' },
      include: {
        currentHandler: { select: { username: true, realName: true } },
        lastProcessor: { select: { username: true, realName: true } },
        notes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    }),
  ])

  return successResponse(paginate(total, list, page, pageSize))
})
