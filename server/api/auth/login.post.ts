import bcrypt from 'bcryptjs'
import { prisma } from '../../plugins/prisma'
import { signToken } from '../../utils/auth'
import { createLog } from '../../utils/logger'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body

  if (!username || !password) {
    throw createError({ statusCode: 400, statusMessage: '用户名和密码不能为空' })
  }

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user || !user.isActive) {
    throw createError({ statusCode: 401, statusMessage: '用户名或密码错误' })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: '用户名或密码错误' })
  }

  const authUser = {
    id: user.id,
    username: user.username,
    realName: user.realName,
    role: user.role,
    storeCode: user.storeCode
  }

  const token = signToken(authUser)

  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/'
  })

  const ip = getHeader(event, 'x-forwarded-for') || event.node.req.socket.remoteAddress
  await createLog({
    actionType: 'USER_LOGIN',
    userId: user.id,
    ip: ip || 'unknown'
  })

  return {
    token,
    user: authUser
  }
})
