import prisma from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'
import { successResponse, errorResponse } from '../../utils/helpers'
import { z } from 'zod'
import type { TournamentStatus } from '@prisma/client'

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  poster: z.string().optional(),
  courtId: z.number().int().optional(),
  organizer: z.string().optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  regDeadline: z.string(),
  maxPlayers: z.number().int().positive(),
  minPlayers: z.number().int().positive().optional().default(2),
  registrationFee: z.number().min(0).optional().default(0),
  prizePool: z.number().min(0).optional().default(0),
  rules: z.string().optional(),
  formatType: z.string().optional(),
  level: z.string().optional(),
  category: z.string().optional()
})

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event, ['SUPER_ADMIN', 'ADMIN', 'MANAGER'])
    const body = await readBody(event)
    const data = createSchema.parse(body)

    const tournament = await prisma.tournament.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        regDeadline: new Date(data.regDeadline),
        status: 'DRAFT' as TournamentStatus
      }
    })
    return successResponse(tournament, '赛事创建成功')
  } catch (e: any) {
    if (e instanceof z.ZodError) return errorResponse(e.errors[0].message, 400)
    return errorResponse(e.message || '创建失败', 500)
  }
})
