import prisma from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'
import { successResponse, errorResponse, paginate, generateOrderNo } from '../../utils/helpers'
import { z } from 'zod'
import type { CheckInStatus } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event)
    const query = getQuery(event)
    const page = Number(query.page) || 1
    const pageSize = Number(query.pageSize) || 20
    const status = query.status as CheckInStatus | undefined
    const keyword = query.keyword as string || ''
    const date = query.date as string

    const where: any = {}
    if (status) where.status = status
    if (date) {
      where.checkInTime = {
        gte: new Date(date),
        lt: new Date(new Date(date).getTime() + 86400000)
      }
    }
    if (keyword) {
      where.OR = [
        { checkInNo: { contains: keyword } },
        { user: { realName: { contains: keyword } } },
        { user: { phone: { contains: keyword } } },
        { booking: { orderNo: { contains: keyword } } },
        { booking: { checkInCode: { contains: keyword } } }
      ]
    }

    const result = await paginate(
      prisma.checkInRecord, page, pageSize, where,
      {
        user: { select: { id: true, realName: true, phone: true } },
        booking: { select: { id: true, orderNo: true, checkInCode: true, startTime: true, endTime: true } },
        court: { select: { id: true, courtNumber: true, name: true } },
        tournament: { select: { id: true, name: true } },
        tournamentReg: { include: { tournament: { select: { id: true, name: true } } } }
      },
      { createdAt: 'desc' }
    )
    return successResponse(result)
  } catch (e: any) {
    return errorResponse(e.message || '获取签到记录失败', 500)
  }
})
