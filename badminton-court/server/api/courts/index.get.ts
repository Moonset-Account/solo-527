import prisma from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'
import { successResponse, errorResponse, paginate } from '../../utils/helpers'
import { z } from 'zod'
import type { CourtStatus } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event)
    const query = getQuery(event)
    const page = Number(query.page) || 1
    const pageSize = Number(query.pageSize) || 100
    const status = query.status as CourtStatus | undefined
    const keyword = query.keyword as string || ''
    const noPagination = query.noPagination === 'true'

    const where: any = {}
    if (status) where.status = status
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { courtNumber: { contains: keyword } },
        { location: { contains: keyword } }
      ]
    }

    if (noPagination) {
      const list = await prisma.court.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { courtNumber: 'asc' }],
        include: { prices: true }
      })
      return successResponse(list)
    }

    const result = await paginate(prisma.court, page, pageSize, where, { prices: true }, [{ sortOrder: 'asc' }, { courtNumber: 'asc' }])
    return successResponse(result)
  } catch (e: any) {
    return errorResponse(e.message || '获取场地列表失败', e.statusCode || 500)
  }
})
