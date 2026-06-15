import prisma from '~/server/utils/prisma'
import { comparePassword, generateToken } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body

  if (!username || !password) {
    return errorResponse('用户名和密码不能为空')
  }

  const user = await prisma.user.findUnique({
    where: { username },
    include: { tenant: true }
  })

  if (!user) {
    return errorResponse('用户不存在', 404)
  }

  if (!comparePassword(password, user.password)) {
    return errorResponse('密码错误')
  }

  const token = generateToken(user.id, user.role)

  const { password: _, ...userWithoutPassword } = user

  return successResponse({
    user: userWithoutPassword,
    token
  }, '登录成功')
})
