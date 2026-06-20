import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { verifyPassword, generateToken } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'

const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空')
})

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { username, password } = loginSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      return errorResponse('用户名或密码错误', 401)
    }

    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return errorResponse('用户名或密码错误', 401)
    }

    const token = generateToken({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    })

    return successResponse({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        phone: user.phone
      }
    }, '登录成功')
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    return errorResponse(error.message || '登录失败', 500)
  }
})
