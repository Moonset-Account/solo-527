import prisma from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'
import { successResponse, errorResponse } from '../../utils/helpers'
import { z } from 'zod'
import type { CourtStatus } from '@prisma/client'

const courtSchema = z.object({
  courtNumber: z.string().min(1),
  name: z.string().min(1),
  courtType: z.string().min(1),
  location: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.enum(['AVAILABLE', 'BOOKED', 'IN_USE', 'MAINTENANCE', 'CLOSED'] as const).optional().default('AVAILABLE'),
  maxCapacity: z.number().int().positive().optional().default(4),
  facilities: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  sortOrder: z.number().int().optional().default(0)
})

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event, ['SUPER_ADMIN', 'ADMIN', 'MANAGER'])
    const body = await readBody(event)
    const data = courtSchema.parse(body)

    const exists = await prisma.court.findUnique({ where: { courtNumber: data.courtNumber } })
    if (exists) return errorResponse('场地编号已存在', 409)

    const court = await prisma.court.create({
      data: {
        ...data,
        location: data.location || null,
        description: data.description || null,
        facilities: data.facilities || null,
        imageUrl: data.imageUrl || null,
        status: data.status as CourtStatus
      }
    })
    return successResponse(court, '创建成功')
  } catch (e: any) {
    if (e instanceof z.ZodError) return errorResponse(e.errors[0].message, 400)
    return errorResponse(e.message || '创建失败', 500)
  }
})
