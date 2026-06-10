import { requireAuth } from '~/server/utils/response'
import { successResponse, paginate } from '~/server/utils/response'
import { usePrisma } from '~/server/plugins/prisma'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 20
  const keyword = query.keyword as string
  const status = query.status as string
  const vehicleType = query.vehicleType as string
  const district = query.district as string

  const prisma = usePrisma()

  const where: any = {}

  if (keyword) {
    where.OR = [
      { riderNo: { contains: keyword } },
      { realName: { contains: keyword } },
      { phone: { contains: keyword } },
    ]
  }

  if (status) {
    const statuses = status.split(',')
    if (statuses.length > 1) {
      where.status = { in: statuses }
    } else {
      where.status = status
    }
  }

  if (vehicleType) {
    where.vehicleType = vehicleType
  }

  if (district) {
    where.currentDistrict = district
  }

  const [total, list] = await Promise.all([
    prisma.rider.count({ where }),
    prisma.rider.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return successResponse(paginate(total, list, page, pageSize))
})
