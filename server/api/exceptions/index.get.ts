import { requireAuth } from '~/server/utils/response'
import { successResponse, paginate } from '~/server/utils/response'
import { usePrisma } from '~/server/plugins/prisma'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 20
  const status = query.status as string
  const apiName = query.apiName as string
  const docId = query.docId as string
  const keyword = query.keyword as string

  const prisma = usePrisma()

  const where: any = {}

  if (status) {
    where.status = status
  }

  if (apiName) {
    where.apiName = { contains: apiName }
  }

  if (docId) {
    where.docId = BigInt(docId)
  }

  if (keyword) {
    where.OR = [
      { errorMessage: { contains: keyword } },
      { apiName: { contains: keyword } },
      { errorCode: { contains: keyword } },
    ]
  }

  const [total, list] = await Promise.all([
    prisma.apiExceptionLog.count({ where }),
    prisma.apiExceptionLog.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        handler: { select: { username: true, realName: true } },
      },
    }),
  ])

  return successResponse(paginate(total, list, page, pageSize))
})
