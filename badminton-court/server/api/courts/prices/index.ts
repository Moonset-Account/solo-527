import prisma from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'
import { successResponse, errorResponse } from '../../utils/helpers'
import { z } from 'zod'

const priceSchema = z.object({
  courtId: z.number().int().positive(),
  weekDay: z.number().int().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  price: z.number().min(0),
  memberPrice: z.number().min(0),
  isHoliday: z.boolean().optional().default(false),
  isSpecial: z.boolean().optional().default(false),
  specialName: z.string().optional().nullable(),
  effectiveStart: z.string().optional().nullable(),
  effectiveEnd: z.string().optional().nullable()
})

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event, ['SUPER_ADMIN', 'ADMIN', 'MANAGER'])
    const method = event.method
    const query = getQuery(event)

    if (method === 'GET') {
      const courtId = query.courtId ? Number(query.courtId) : undefined
      const weekDay = query.weekDay !== undefined ? Number(query.weekDay) : undefined
      const where: any = { status: 1 }
      if (courtId) where.courtId = courtId
      if (weekDay !== undefined) where.weekDay = weekDay
      const prices = await prisma.courtPrice.findMany({
        where,
        orderBy: [{ weekDay: 'asc' }, { startTime: 'asc' }],
        include: { court: { select: { id: true, courtNumber: true, name: true } } }
      })
      return successResponse(prices)
    }

    if (method === 'POST') {
      const body = await readBody(event)
      const data = priceSchema.parse(body)
      const price = await prisma.courtPrice.create({
        data: {
          ...data,
          specialName: data.specialName || null,
          effectiveStart: data.effectiveStart ? new Date(data.effectiveStart) : null,
          effectiveEnd: data.effectiveEnd ? new Date(data.effectiveEnd) : null
        }
      })
      return successResponse(price, '创建成功')
    }

    if (method === 'PUT') {
      const id = Number(query.id)
      if (!id) return errorResponse('参数错误', 400)
      const body = await readBody(event)
      const data = priceSchema.partial().parse(body)
      const price = await prisma.courtPrice.update({
        where: { id },
        data: {
          ...data,
          effectiveStart: data.effectiveStart ? new Date(data.effectiveStart) : undefined,
          effectiveEnd: data.effectiveEnd ? new Date(data.effectiveEnd) : undefined
        }
      })
      return successResponse(price, '更新成功')
    }

    if (method === 'DELETE') {
      const id = Number(query.id)
      if (!id) return errorResponse('参数错误', 400)
      await prisma.courtPrice.update({ where: { id }, data: { status: 0 } })
      return successResponse(null, '删除成功')
    }

    return errorResponse('不支持的方法', 405)
  } catch (e: any) {
    if (e instanceof z.ZodError) return errorResponse(e.errors[0].message, 400)
    return errorResponse(e.message || '操作失败', 500)
  }
})
