import prisma from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'
import { successResponse, errorResponse } from '../../utils/helpers'
import { z } from 'zod'
import type { CourtStatus } from '@prisma/client'

const updateSchema = z.object({
  courtNumber: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  courtType: z.string().min(1).optional(),
  location: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.enum(['AVAILABLE', 'BOOKED', 'IN_USE', 'MAINTENANCE', 'CLOSED'] as const).optional(),
  maxCapacity: z.number().int().positive().optional(),
  facilities: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  sortOrder: z.number().int().optional()
})

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event, ['SUPER_ADMIN', 'ADMIN', 'MANAGER'])
    const id = Number(getRouterParam(event, 'id'))
    if (!id) return errorResponse('参数错误', 400)
    const exists = await prisma.court.findUnique({ where: { id } })
    if (!exists) return errorResponse('场地不存在', 404)

    const body = await readBody(event)
    const data = updateSchema.parse(body)

    const court = await prisma.court.update({
      where: { id },
      data: { ...data, status: data.status as CourtStatus | undefined }
    })
    return successResponse(court, '更新成功')
  } catch (e: any) {
    if (e instanceof z.ZodError) return errorResponse(e.errors[0].message, 400)
    return errorResponse(e.message || '更新失败', 500)
  }
})
