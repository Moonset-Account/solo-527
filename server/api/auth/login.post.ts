import bcrypt from 'bcryptjs'
import { signToken } from '~/server/utils/jwt'
import { successResponse, errorResponse } from '~/server/utils/response'
import { usePrisma } from '~/server/plugins/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body

  if (!username || !password) {
    return errorResponse('用户名和密码不能为空', 400)
  }

  const prisma = usePrisma()

  const user = await prisma.user.findUnique({
    where: { username },
  })

  if (!user) {
    return errorResponse('用户名或密码错误', 400)
  }

  if (user.status !== 'ACTIVE') {
    return errorResponse('账号已被禁用', 403)
  }

  const isValid = bcrypt.compareSync(password, user.passwordHash)
  if (!isValid) {
    return errorResponse('用户名或密码错误', 400)
  }

  const token = signToken({
    userId: String(user.id),
    username: user.username,
    role: user.role,
    realName: user.realName || undefined,
  })

  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
    },
  })

  return successResponse({
    token,
    user: {
      userId: String(user.id),
      username: user.username,
      realName: user.realName,
      role: user.role,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
    },
  }, '登录成功')
})
