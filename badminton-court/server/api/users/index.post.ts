import prisma from '../../utils/prisma'
import { requireAuth, hashPassword } from '../../utils/auth'
import { successResponse, errorResponse } from '../../utils/helpers'
import { z } from 'zod'
import type { Role } from '@prisma/client'

const createSchema = z.object({
  username: z.string().min(3).max(50),
  phone: z.string().min(11).max(11),
  email: z.string().email().optional().nullable(),
  password: z.string().min(6),
  realName: z.string().optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'COACH', 'STAFF', 'CUSTOMER'] as const),
  balance: z.number().optional().default(0)
})

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event, ['SUPER_ADMIN', 'ADMIN'])
    const body = await readBody(event)
    const data = createSchema.parse(body)

    const exists = await prisma.user.findFirst({
      where: { OR: [{ username: data.username }, { phone: data.phone }] }
    })
    if (exists) {
      return errorResponse('用户名或手机号已存在', 409)
    }

    const user = await prisma.user.create({
      data: {
        ...data,
        email: data.email || null,
        password: hashPassword(data.password),
        role: data.role as Role
      },
      include: { coachProfile: true }
    })

    const { password, ...safeUser } = user
    return successResponse(safeUser, '创建成功')
  } catch (e: any) {
    if (e instanceof z.ZodError) return errorResponse(e.errors[0].message, 400)
    return errorResponse(e.message || '创建失败', 500)
  }
})
