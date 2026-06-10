import prisma from '../../utils/prisma'
import { hashPassword, comparePassword, generateToken } from '../../utils/auth'
import { successResponse, errorResponse } from '../../utils/helpers'
import { z } from 'zod'

const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(6, '密码至少6位')
})

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const validated = loginSchema.parse(body)

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: validated.username },
          { phone: validated.username },
          { email: validated.username }
        ]
      },
      include: { coachProfile: true }
    })

    if (!user) {
      return errorResponse('用户不存在', 404)
    }

    if (user.status !== 1) {
      return errorResponse('账号已被禁用', 403)
    }

    if (!comparePassword(validated.password, user.password)) {
      return errorResponse('密码错误', 401)
    }

    const token = generateToken({ userId: user.id, role: user.role })

    const permissionCodes = user.role === 'SUPER_ADMIN'
      ? (await prisma.permission.findMany({ select: { code: true } })).map(p => p.code)
      : (await prisma.rolePermission.findMany({
          where: { role: user.role },
          include: { permission: true }
        })).map(rp => rp.permission.code)

    const { password, ...userWithoutPassword } = user

    return successResponse({
      token,
      user: userWithoutPassword,
      permissions: permissionCodes
    }, '登录成功')
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return errorResponse(e.errors[0].message, 400)
    }
    return errorResponse(e.message || '登录失败', 500)
  }
})
