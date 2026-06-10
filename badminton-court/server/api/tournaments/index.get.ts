import prisma from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'
import { successResponse, errorResponse, paginate } from '../../utils/helpers'
import { z } from 'zod'
import type { TournamentStatus } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event)
    const query = getQuery(event)
    const page = Number(query.page) || 1
    const pageSize = Number(query.pageSize) || 20
    const status = query.status as TournamentStatus | undefined
    const keyword = query.keyword as string || ''
    const noPagination = query.noPagination === 'true'

    const where: any = {}
    if (status) where.status = status
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { description: { contains: keyword } },
        { organizer: { contains: keyword } }
      ]
    }

    const orderBy = [{ startDate: 'asc' }, { createdAt: 'desc' }] as const

    if (noPagination) {
      const list = await prisma.tournament.findMany({ where, orderBy })
      return successResponse(list)
    }

    const result = await paginate(prisma.tournament, page, pageSize, where, undefined, orderBy)
    return successResponse(result)
  } catch (e: any) {
    return errorResponse(e.message || '获取赛事列表失败', 500)
  }
})
